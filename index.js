const express = require('express');
const app = express();
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health-check route
app.get('/', (req, res) => {
  res.json({ message: 'Payment Service API is up and running!' });
});

// Basic route for the payment service
app.use('/api/payment', require('./src/routes/payment.routes'));

// Define the port
const port = process.env.PORT || 5001;

// Start the Express server
app.listen(port, () => {
  console.log(`Payment Service running on port ${port}`);
});

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);  // Exit the process to prevent unexpected behavior
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);  // Exit the process to prevent unexpected behavior
});