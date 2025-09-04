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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: {
            user: "apikey",
            pass: process.env.SENDGRID_API_KEY
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify Your Email",
        text: `Your OTP for email verification is ${otp}. It is valid for 10 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("OTP email sent to:", email);
    } catch (err) {
        console.error("Error sending email:", err);
        throw err;
    }

    return { otp, otpExpiry };
};

const resendOTP = async (user) => {
    const { sendOTP } = module.exports; // reuse existing sendOTP
    const { otp, otpExpiry } = await sendOTP(user.email);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    return { otp, otpExpiry };
};

module.exports = {
    createTokenForUser,
    validateToken,
    sendOTP,
    resendOTP
}
   