const express = require("express");
const { makepayment, handleWebhook, getRecentPayments,refundPayment} = require("../controllers/payment.controller");

const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken);

router.post("/create-checkout-session", makepayment);
router.post("/", makepayment);
router.post("/refund", refundPayment);

router.post("/webhook", express.raw({ type: 'application/json' }), handleWebhook);

router.get('/recent', getRecentPayments);
module.exports = router;
