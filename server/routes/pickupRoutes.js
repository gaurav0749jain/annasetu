const express = require('express');
const router = express.Router();
const { getMyPickups, updatePickupStatus, getAvailablePickups } = require('../controllers/pickupController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/my', protect, getMyPickups);
router.get('/available', protect, authorizeRoles('volunteer'), getAvailablePickups);
router.put('/:id/status', protect, updatePickupStatus);

module.exports = router;