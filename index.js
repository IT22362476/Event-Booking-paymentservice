const express = require('express');
const app = express();
const dotenv = require('dotenv');

dotenv.config();  // Load environment variables

// Basic route for the payment service
app.get('/api/payment', (req, res) => {
  res.json({ message: 'Payment Service is working!' });
});

// Define the port
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Payment Service running on port ${port}`);
});