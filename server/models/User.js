const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['donor', 'receiver', 'volunteer', 'admin'],
        default: 'donor',
    },
    donorType: {
        type: String,
        enum: ['individual', 'restaurant', 'event', 'office', 'college', 'other'],
        default: 'individual',
    },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    avatar: { type: String },
    isVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    otp: { type: String },
    otpExpiry: { type: Date },
    refreshToken: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);