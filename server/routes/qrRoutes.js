const express = require('express');
const router = express.Router();
const { generatePickupQR, verifyQR, getQRStatus } = require('../controllers/qrController');
const { protect } = require('../middleware/auth');

router.get('/generate/:id', protect, generatePickupQR);
router.post('/verify', protect, verifyQR);
router.get('/status/:id', protect, getQRStatus);

module.exports = router;