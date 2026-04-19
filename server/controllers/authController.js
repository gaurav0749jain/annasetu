const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (req, res) => {
    const { name, email, password, role, donorType, phone, city } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
        name, email, password, role: role || 'donor',
        donorType: donorType || 'individual',
        phone, city, otp, otpExpiry,
    });

    await sendEmail({
        to: email,
        subject: 'AnnaSetu - Verify your email',
        html: `<h2>Welcome to AnnaSetu!</h2>
           <p>Your OTP is: <strong>${otp}</strong></p>
           <p>This OTP expires in 10 minutes.</p>`,
    });

    res.status(201).json({
        message: 'Registration successful. Check your email for OTP.',
        userId: user._id
    });
};

const verifyOTP = async (req, res) => {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ message: 'OTP expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
        message: 'Email verified successfully',
        accessToken, refreshToken,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email first' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
        accessToken, refreshToken,
        user: {
            id: user._id, name: user.name, email: user.email,
            role: user.role, donorType: user.donorType
        }
    });
};

const getMe = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password -otp -refreshToken');
    res.json(user);
};

module.exports = { register, verifyOTP, login, getMe };