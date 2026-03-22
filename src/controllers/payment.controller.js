const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { sendNotificationEvent } = require("../services/notification.service");
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
const axios = require('axios');
const Payment = require("../models/payment.model");

function getApiGatewayUrl() {
  return (process.env.API_GATEWAY_URL || "http://localhost:8080").replace(/\/$/, "");
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
}

// Helper to build metadata for notifications
function buildPaymentMetadata(payload = {}, session = null) {
  return {
    bookingId: payload.bookingId || null,
    eventId: payload.eventId || null,
    eventTitle: payload.eventName || payload.title || payload.menuItemName || null,
    paymentId: session?.id || payload.paymentId || null,
    amount:
      payload.amount ??
      payload.totalAmount ??
      (Array.isArray(payload.products)
        ? payload.products.reduce(
            (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
            0,
          )
        : null),
    currency: (payload.currency || "LKR").toUpperCase(),
    numberOfTickets: payload.numberOfTickets || payload.quantity || null,
    checkoutUrl: session?.url || null,
  };
}

async function dispatchNotification(payload, token) {
  try {
    await sendNotificationEvent(payload, token);
  } catch (error) {
    console.error("Failed to dispatch payment notification:", error.message);
  }
}

const paymentController = {
  async makepayment(req, res) {
    try {
      const { products, bookingId } = req.body;
      const userToken = req.token;
      const userId = req.user.id || req.user.userId || req.user._id;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map(p => ({
          price_data: {
            currency: "lkr",
            product_data: {
              name: p.menuItemName,
              images: p.image
                ? [p.image]
                : ["https://images.unsplash.com/photo-1549451371-64aa98a6f660?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
            },
            unit_amount: Math.round(p.price * 100),
          },
          quantity: p.quantity,
        })),
        mode: "payment",
        client_reference_id: bookingId,
        metadata: {
          authToken: userToken,
          userId: userId
        },
        success_url: `${getFrontendUrl()}/paymentsuccess`,
        cancel_url: `${getFrontendUrl()}/paymentcanceled`,
      });

      // Dispatch Notification for Checkout Created
      if (userId && userToken) {
        await dispatchNotification(
          {
            eventType: "PAYMENT_CHECKOUT_CREATED",
            source: "PAYMENT_SERVICE",
            entityId: session.id,
            entityType: "PAYMENT",
            actorUserId: userId,
            recipients: { userId: userId },
            metadata: buildPaymentMetadata(req.body, session),
          },
          userToken,
        );
      }

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message || "An error occurred during checkout" });
    }
  },

  async handleWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const bookingId = session.client_reference_id;
        const authToken = session.metadata.authToken;

        if (bookingId) {
          try {
            // 1. Update Booking Service
            const response = await axios.patch(
              `${getApiGatewayUrl()}/api/bookings/${bookingId}/payment`,
              { paymentStatus: "SUCCESS" },
              { headers: { Authorization: `Bearer ${authToken}` } }
            );

            // 2. Extract eventName from response
            const updatedBooking = response.data;
            const eventName = updatedBooking.eventName || "Unknown Event";

            // 3. Save to MongoDB
            const newPayment = new Payment({
              bookingId: bookingId,
              eventName: eventName,
              stripeSessionId: session.id,
              userId: session.metadata.userId,
              amount: session.amount_total / 100,
              currency: session.currency.toUpperCase(),
              status: "SUCCESS"
            });

            await newPayment.save();
            console.log(`💾 Payment saved for event: ${eventName}`);

          } catch (error) {
            console.error("❌ Webhook processing failed:", error.message);
          }
        }
      }
      res.status(200).send("Event received");
    } catch (err) {
      console.error("Webhook Signature Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  },

  async getRecentPayments(req, res) {
    try {
      const userId = req.user.id || req.user.userId || req.user._id;

      const payments = await Payment.find({ userId: userId })
        .sort({ createdAt: -1 })
        .limit(10);

      res.status(200).json(payments);
    } catch (error) {
      console.error("Error fetching recent payments:", error);
      res.status(500).json({ message: "Failed to fetch payment history" });
    }
  },

  async refundPayment(req, res) {
    try {
      const refundReference = `refund_${Date.now()}`;
      const userId = req.user?.id || req.user?._id;

      if (userId && req.token) {
        await dispatchNotification(
          {
            eventType: "PAYMENT_REFUNDED",
            source: "PAYMENT_SERVICE",
            entityId: refundReference,
            entityType: "PAYMENT",
            actorUserId: userId,
            recipients: { userId: userId },
            metadata: {
              ...buildPaymentMetadata(req.body),
              paymentId: refundReference,
            },
          },
          req.token,
        );
      }

      res.json({
        status: "REFUNDED",
        id: refundReference,
        bookingId: req.body?.bookingId || null,
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ error: "An error occurred during refund" });
    }
  }
};

module.exports = paymentController;

