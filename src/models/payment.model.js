const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: String }, // Simplified from bookingIds (plural)
  eventName: { type: String }, // New field
  stripeSessionId: { type: String, required: true },
  userId: { type: String },
  amount: { type: Number },
  currency: { type: String },
  status: { type: String, default: 'SUCCESS' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);