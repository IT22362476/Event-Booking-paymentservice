const express = require("express");
const { makepayment, refundPayment } = require("../controllers/payment.controller");

const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken);

router.post("/create-checkout-session", makepayment);
router.post("/", makepayment);
router.post("/refund", refundPayment);

module.exports = router;
