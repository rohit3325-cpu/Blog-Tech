const {validateToken} = require('../services/authentication');

function checkForAuthenticationCookie(cookieName) {
    return(req,res,next)=>{
        const tokenCookieValue = req.cookies[cookieName]
        if(!tokenCookieValue) {
           return next();
        }
       
       try {
        
         const userPayload = validateToken(tokenCookieValue);
         req.user= userPayload;     
       } catch (error) {}
        next()
    };
}

function ensureAuth(req, res, next) {
  if (req.user) {
    return next();
  }
  return res.redirect("/login"); // Or res.status(401).send("Unauthorized")
}

module.exports = { ensureAuth };


module.exports = {
    checkForAuthenticationCookie,
};