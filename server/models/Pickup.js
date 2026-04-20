const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    status: {
        type: String,
        enum: ['claimed', 'confirmed', 'volunteer-assigned', 'in-transit', 'delivered', 'cancelled'],
        default: 'claimed',
    },
    statusHistory: [{
        status: String,
        updatedAt: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    pickupAddress: { type: String },
    deliveryAddress: { type: String },
    notes: { type: String },
    deliveredAt: { type: Date },

    // QR Code fields
    pickupQRToken: { type: String },
    deliveryQRToken: { type: String },
    pickupQRScanned: { type: Boolean, default: false },
    deliveryQRScanned: { type: Boolean, default: false },
    pickupQRScannedAt: { type: Date },
    deliveryQRScannedAt: { type: Date },
    pickupQRScannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryQRScannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

module.exports = mongoose.model('Pickup', pickupSchema);