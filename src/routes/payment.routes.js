const express = require("express");
const { makepayment } = require("../controllers/payment.controller");

const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");

router.use(verifyToken);
// Example protected route for processing payments

router.post("/create-checkout-session", makepayment);

module.exports = router;
