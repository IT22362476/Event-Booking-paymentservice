const express = require('express');
const app = express();
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Add this above your payment route
app.get('/', (req, res) => {
  res.send('Payment Service API is up and running!');
});

// Basic route for the payment service
app.get('/api/payment', (req, res) => {
  res.json({ message: 'Payment Service is working!' });
});

// Define the port
const port = process.env.PORT || 8080;

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