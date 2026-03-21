const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const app = express();
const paymentRoutes = require("./src/routes/payment.routes");

// Parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health-check route
app.get("/", (req, res) => {
  res.json({ message: "Payment Service API is up and running!" });
});

// Keep the legacy route and add compatible aliases used by the gateway/services.
app.use("/api/payment", paymentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/payments", paymentRoutes);

// Define the port
const port = process.env.PORT || 5001;

// Start the Express server
app.listen(port, () => {
  console.log(`Payment Service running on port ${port}`);
});

// Handle unhandled promise rejections and uncaught exceptions
process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});
