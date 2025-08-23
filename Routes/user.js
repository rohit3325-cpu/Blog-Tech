const {Router} = require("express");
const User = require("../models/user"); // Assuming the user model is in models/user.js
const { register, verifyOTP } = require('../controllers/user');

const router = Router();

router.get("/signin",(req,res)=>{
   res.render("signin");
});

router.get("/signup",(req,res)=>{
   res.render("signup");
});

router.post('/signin', async(req,res)=>{
   try {
          const { email, password } = req.body;
    const token = await User.matchPasswordAndgenerateToken(email, password);

    return res.cookie("token", token).redirect("/");
   } catch (error) {
      const message = error && error.message ? error.message : "Invalid email or password";
      return res.render("signin", { error: message });
   }
})

// Delegate legacy /signup POST to OTP-based register flow
router.post("/signup", (req, res) => {
   return register(req, res);
});

router.get("/logout",(req,res)=>{
     res.clearCookie("token").redirect("/");
});

router.post('/register', register);
router.post('/verify-otp', verifyOTP);

module.exports = router;