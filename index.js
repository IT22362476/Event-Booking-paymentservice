const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const paymentRoutes = require("./src/routes/payment.routes");

// Load environment variables
dotenv.config();

// 1. Connect to Database
connectDB();

const app = express();

// 2. Configure CORS
// This fixes the 'CORS error' seen in your browser console
app.use(cors({
  origin: 'http://localhost:3000', // Allow your React Frontend
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// 3. Special Middleware for Stripe Webhooks
// Stripe requires the RAW body to verify signatures.
// This prevents 'Webhook Error: No webhook payload was provided'
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payment/webhook') {
    return next(); 
  }
  express.json()(req, res, next);
});

app.use(express.urlencoded({ extended: true }));

// 4. Health-check route
app.get("/", (req, res) => {
  res.json({ message: "Payment Service API is up and running!" });
});

// 5. Routes with Aliases
// Adding these aliases ensures compatibility if your Gateway calls different paths
app.use("/api/payment", paymentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/payments", paymentRoutes);

const port = process.env.PORT || 5001;

app.listen(port, () => {
  console.log(`Payment Service running on port ${port}`);
});

// 6. Global Error Handling
// Prevents the service from crashing silently on unhandled errors
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});