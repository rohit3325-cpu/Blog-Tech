const User = require('../models/user');
const { sendOTP } = require('../services/authentication');

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        // Send OTP
        const { otp, otpExpiry } = await sendOTP(email);

        const user = await User.create({ name, email, password, otp, otpExpiry });
        res.status(201).json({ message: 'OTP sent to your email', userId: user._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.otp !== otp || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
