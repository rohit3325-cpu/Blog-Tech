const User = require('../models/user');
const { sendOTP, createTokenForUser } = require('../services/authentication');
const bcrypt = require('bcrypt');

// Register new user
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP and expiry
        const { otp, otpExpiry } = await sendOTP(email);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            isVerified: false
        });

        res.status(201).json({ message: 'OTP sent to your email', userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
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

        // Optional: generate JWT after verification
        const token = createTokenForUser(user);

        res.status(200).json({ message: 'Email verified successfully', token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

const { resendOTP } = require('../services/authentication');

const resendOtpController = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

        await resendOTP(user);

        res.status(200).json({ message: "OTP resent to your email" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    register,
    verifyOTP,
    resendOtpController
};
