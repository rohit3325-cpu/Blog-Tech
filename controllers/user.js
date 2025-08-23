const User = require('../models/user');
const { sendOTP } = require('../services/authentication');

exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).render('signup', { error: 'Email already registered' });
        }

        const { otp, otpExpiresAt } = await sendOTP(email);

        const user = await User.create({ fullName, email, password, otp, otpExpiresAt, isVerified: false });

        return res.status(201).render('verify-otp', { userId: user._id, email });
    } catch (err) {
        return res.status(500).render('signup', { error: err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).render('signin', { error: 'User not found' });
        }

        const isExpired = user.otpExpiresAt && user.otpExpiresAt.getTime() < Date.now();
        if (user.otp !== otp || isExpired) {
            return res.status(400).render('verify-otp', { userId, email: user.email, error: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        return res.redirect('/user/signin');
    } catch (err) {
        return res.status(500).render('signin', { error: err.message });
    }
};
