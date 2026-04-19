const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
        type: String,
        enum: ['new-listing', 'claim', 'confirmed', 'in-transit', 'delivered', 'message', 'system'],
        default: 'system',
    },
    relatedListing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
    },
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);