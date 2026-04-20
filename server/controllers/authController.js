const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (req, res) => {
    try {
        const { name, email, password, role, donorType, phone, city } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists with this email' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        const user = await User.create({
            name, email, password,
            role: role || 'donor',
            donorType: donorType || 'individual',
            phone, city, otp, otpExpiry,
        });

        try {
            await sendEmail({
                to: email,
                subject: 'AnnaSetu - Verify your email',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Welcome to AnnaSetu! 🍱</h2>
            <p>Hi ${name}, thank you for joining us!</p>
            <p>Your OTP verification code is:</p>
            <div style="background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #16a34a; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666;">This OTP expires in 10 minutes.</p>
            <p style="color: #666; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
          </div>
        `,
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError.message);
        }

        res.status(201).json({
            message: 'Registration successful! Check your email for OTP.',
            userId: user._id,
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: error.message || 'Registration failed' });
    }
};

const verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (user.otpExpiry < Date.now()) return res.status(400).json({ message: 'OTP expired. Please register again.' });

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            message: 'Email verified successfully!',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                donorType: user.donorType,
            },
        });
    } catch (error) {
        console.error('VerifyOTP error:', error);
        res.status(500).json({ message: error.message || 'Verification failed' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first. Check your inbox for OTP.' });
        }
        if (!user.isApproved) {
            return res.status(401).json({ message: 'Your account is suspended. Contact support.' });
        }

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        user.refreshToken = refreshToken;
        await user.save();

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                donorType: user.donorType,
                city: user.city,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message || 'Login failed' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -otp -refreshToken');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { register, verifyOTP, login, getMe };