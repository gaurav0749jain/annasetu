const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    foodType: {
        type: String,
        enum: ['veg', 'non-veg', 'both'],
        required: true,
    },
    category: {
        type: String,
        enum: ['cooked', 'raw', 'packaged', 'bakery', 'fruits', 'vegetables', 'other'],
        default: 'cooked',
    },
    listingType: {
        type: String,
        enum: ['regular', 'event'],
        default: 'regular',
    },
    eventDetails: {
        eventType: String,
        eventDate: Date,
        guestCount: Number,
    },
    quantity: { type: Number, required: true },
    unit: {
        type: String,
        enum: ['plates', 'kg', 'litres', 'packets', 'boxes', 'items'],
        default: 'plates',
    },
    images: [{ type: String }],
    pickupAddress: { type: String, required: true },
    city: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
    },
    pickupFrom: { type: Date, required: true },
    pickupUntil: { type: Date, required: true },
    safetyWindow: { type: String },
    status: {
        type: String,
        enum: ['available', 'claimed', 'in-transit', 'delivered', 'expired', 'cancelled'],
        default: 'available',
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    tags: [{ type: String }],
    mealsCount: { type: Number, default: 0 },
}, { timestamps: true });

listingSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Listing', listingSchema);