const { Router } = require("express");
const User = require("../models/user");
const { register, verifyOTP, resendOtpController } = require('../controllers/user');

const router = Router();

// Render pages
router.get("/signin", (req, res) => {
   res.render("signin");
});

router.get("/signup", (req, res) => {
   res.render("signup");
});

// Login route
router.post('/signin', async (req, res) => {
   try {
      const { email, password } = req.body;
      const token = await User.matchPasswordAndgenerateToken(email, password);

      return res.cookie("token", token).redirect("/");
   } catch (error) {
      return res.render("signin", { 
         error: "Invalid email or password" 
      });
   }
});

// 🚨 Remove old /signup (direct insert) to avoid bypass
// Use OTP-based /register instead
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOtpController);

// Logout
router.get("/logout", (req, res) => {
   res.clearCookie("token").redirect("/");
});

module.exports = router;
