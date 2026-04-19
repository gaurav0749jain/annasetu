const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { autoFillListing, predictFoodSafety } = require('../ai/listingAI');
const { analyzeFoodImage } = require('../ai/imageAI');
const { smartMatch } = require('../ai/matchingAI');
const { chatWithBot } = require('../ai/chatbotAI');
const { generateImpactReport } = require('../ai/reportAI');

const memoryUpload = multer({ storage: multer.memoryStorage() });

router.post('/autofill', protect, autoFillListing);
router.post('/safety', protect, predictFoodSafety);
router.post('/analyze-image', protect, memoryUpload.single('image'), analyzeFoodImage);
router.post('/match', protect, smartMatch);
router.post('/chat', protect, chatWithBot);
router.get('/report', protect, generateImpactReport);

module.exports = router;