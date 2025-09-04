const JWT = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const secret = "$ironMan33";

function createTokenForUser(user){
    const payload = {
        _id:user.id,
        email:user.email,
        profileImageURL:user.profileImageURL,
        role: user.role,
    };
    const token = JWT.sign(payload, secret,);
    return token;
}


function validateToken(token){
    const payload = JWT.verify(token,secret);
    return payload;
}




const sendOTP = async (email) => {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Or any SMTP
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Email Verification',
        text: `Your OTP is ${otp}. It is valid for 10 minutes.`
    };

    await transporter.sendMail(mailOptions);

    return { otp, otpExpiry };
};

module.exports = {
    createTokenForUser,
    validateToken,
    sendOTP
}