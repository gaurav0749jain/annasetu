const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .populate('relatedListing', 'title')
        .sort({ createdAt: -1 })
        .limit(20);
    res.json(notifications);
};

const markAsRead = async (req, res) => {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: 'Marked as read' });
};

const markAllAsRead = async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );
    res.json({ message: 'All notifications marked as read' });
};

const getUnreadCount = async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
    });
    res.json({ count });
};

const deleteNotification = async (req, res) => {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notification deleted' });
};

module.exports = {
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
};