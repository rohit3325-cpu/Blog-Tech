const {Schema,model} = require('mongoose');
const { createHmac,randomBytes } = require('crypto');
const { createTokenForUser } = require('../services/authentication');

const userSchema = new Schema({
    fullName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique: true,
    },
    salt:{
        type:String,
        
    },
    password: {
        type:String,
        required:true,
    },
    profileImageURL:{
        type:String,
        default:"/images/image_avatar.png"
    },
    role:{
        type: String,
        enum: ["USER","ADMIN"],
        default:"USER",
    },
     otp: {
      type: String,
    },
    otpExpiresAt: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
},
 {timestamps: true});

 userSchema.pre("save", function (next) {
    const user = this;

    if(!user.isModified("password")) return next();

    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac('sha256', salt)
       .update(user.password)
       .digest("hex");

       this.salt = salt;
       this.password = hashedPassword;

       next();
 })

  userSchema.static('matchPasswordAndgenerateToken', async function(email,password) {
    const user= await this.findOne({ email });
    if(!user) throw new Error("User not found");
    if(!user.isVerified) {
        throw new Error("Please verify your email");
    }

    const salt = user.salt;
    const hashedpassword= user.password;

    const userProvidedHashedPassword = createHmac('sha256', salt)
       .update(password)
       .digest("hex");

       if(userProvidedHashedPassword !== hashedpassword) {
        throw new Error("Invalid Password");
       }

    const token = createTokenForUser(user);
    return token;
  });

 const User = model('user', userSchema);
 module.exports = User;