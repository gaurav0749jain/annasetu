const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/me', protect, getMe);

router.put('/profile', protect, async (req, res) => {
    try {
        const { name, phone, city, address } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, phone, city, address },
            { new: true }
        ).select('-password -otp -refreshToken');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;