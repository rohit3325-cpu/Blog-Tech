const User = require('../models/user');
const { sendOTP, createTokenForUser, resendOTP } = require('../services/authentication');

// Register new user
const register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        let existingUser = await User.findOne({ email });

        if (existingUser) {
            if (existingUser.isVerified) {
                return res.status(400).json({ message: 'Email already registered' });
            } else {
                // User exists but not verified → update OTP & password
                const { otp, otpExpiry } = await sendOTP(email);

                existingUser.fullName = fullName; // optional: update name
                existingUser.password = password; // will be hashed in pre-save hook
                existingUser.otp = otp;
                existingUser.otpExpiresAt = otpExpiry;
                await existingUser.save();

                console.log(`OTP for ${email} is ${otp}`); // log OTP for testing
                return res.status(200).json({ message: 'OTP resent to your email', email });
            }
        }

        // Create new user if email doesn't exist
        const { otp, otpExpiry } = await sendOTP(email);

        const user = await User.create({
            fullName,
            email,
            password,
            otp,
            otpExpiresAt: otpExpiry,
            isVerified: false,
        });

        console.log(`OTP for ${email} is ${otp}`); // log OTP
        res.status(201).json({ message: 'OTP sent to your email', email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

 if (user.otp.toString() !== otp.toString() || user.otpExpiresAt < Date.now()) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
}


        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        const token = createTokenForUser(user); // optional: login automatically

        res.status(200).json({ 
            message: 'Email verified successfully', 
            token 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};


// Resend OTP
const resendOtpController = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

        const { otp, otpExpiry } = await resendOTP(user.email);
        user.otp = otp;
        user.otpExpiresAt = otpExpiry;
        await user.save();

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
