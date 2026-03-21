const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { sendNotificationEvent } = require("../services/notification.service");

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
      // Accept either an array body or an object with a `products` key
      const products = Array.isArray(req.body)
        ? req.body
        : req.body?.products;

      console.log("Received products:", products);

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "No products provided" });
      }

      // Prepare line items for Stripe checkout session
      const lineItems = products.map((product) => ({
        price_data: {
          currency: "lkr",
          product_data: {
            name: `Event ${product.menuItemName}`,
            images: product.image
              ? [product.image]
              : [
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
                ],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: product.quantity,
      }));

      console.log("Line Items for Stripe:", lineItems);

      // Create a Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: "http://localhost:3000/paymentsuccess",
        cancel_url: "http://localhost:3000/paymentcanceled",
      });

      const actorUserId = req.user?.id || req.user?._id || req.body?.userId;
      if (actorUserId && req.token) {
        await dispatchNotification(
          {
            eventType: "PAYMENT_CHECKOUT_CREATED",
            source: "PAYMENT_SERVICE",
            entityId: session.id,
            entityType: "PAYMENT",
            actorUserId,
            recipients: {
              userId: actorUserId,
            },
            metadata: buildPaymentMetadata(req.body, session),
          },
          req.token,
        );
      }

      // Return BOTH the session ID and URL to the frontend
      res.json({
        id: session.id,
        url: session.url
      });

    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "An error occurred during checkout" });
    }
  },

  async refundPayment(req, res) {
    try {
      const refundReference = `refund_${Date.now()}`;
      const actorUserId = req.user?.id || req.user?._id || req.body?.userId;

      if (actorUserId && req.token) {
        await dispatchNotification(
          {
            eventType: "PAYMENT_REFUNDED",
            source: "PAYMENT_SERVICE",
            entityId: refundReference,
            entityType: "PAYMENT",
            actorUserId,
            recipients: {
              userId: actorUserId,
            },
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
  },
};

module.exports = paymentController;
