const express = require('express');
const router = express.Router();
const {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

module.exports = router;