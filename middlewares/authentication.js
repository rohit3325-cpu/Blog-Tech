const { validateToken } = require("../services/authentication");

function checkForAuthenticationCookie(cookieName) {
  return (req, res, next) => {
    const tokenCookieValue = req.cookies[cookieName];
    if (!tokenCookieValue) {
      return next();
    }

    try {
      const userPayload = validateToken(tokenCookieValue);
      req.user = userPayload;
    } catch (error) {}
    next();
  };
}

// Protects route for logged-in users only
function ensureAuth(req, res, next) {
  if (req.user) {
    return next();
  }
  return res.redirect("/login");
}

// Protects route for verified users only
function ensureVerified(req, res, next) {
  if (req.user && req.user.isVerified) {
    return next();
  }
  return res.status(403).send("Please verify your email before accessing this page.");
}

module.exports = {
  checkForAuthenticationCookie,
  ensureAuth,
  ensureVerified,
};
