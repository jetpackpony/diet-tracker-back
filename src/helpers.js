const crypto = require('crypto');
const jwt = require("jsonwebtoken");

const encodeToken = (payload) => {
  return jwt.sign(payload, process.env["JWT_SECRET"]);
};

const decodeToken = (token) => {
  try {
    const payload = jwt.verify(
      token.replace("Bearer ", ""),
      process.env["JWT_SECRET"]
    );
    return payload;
  } catch(e) {
    return null;
  }
};

const encodePassword = (password) => {
  return crypto
    .createHmac('sha256', process.env["PASS_SECRET"])
    .update(password)
    .digest('hex');
}

module.exports = {
  encodeToken,
  encodePassword,
  decodeToken
};