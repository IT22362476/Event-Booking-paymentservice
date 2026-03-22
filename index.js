require("dotenv").config();

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./src/config/db");
const paymentRoutes = require("./src/routes/payment.routes");

// 1. Connect to Database
connectDB();

const app = express();

// 2. Configure CORS
// This fixes the 'CORS error' seen in your browser console
// 1. Properly parse origins from Azure Env Vars
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
]
  .map((origin) => origin.trim())
  .filter(Boolean);

// 2. Configure CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.error(`🔴 CORS blocked for origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], // Added OPTIONS
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Added X-Requested-With
  credentials: true
}));

app.options('*', cors());


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
