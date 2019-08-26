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

function decorateObject(obj, cb) {
  if (typeof obj === "object") {
    return Object.keys(obj).reduce((res, key) => {
      if (obj.hasOwnProperty(key)) {
        res[key] = decorateObject(obj[key], cb);
      }
      return res;
    }, {});
  } else {
    return cb(obj);
  }
};

const authResolverDecorator = (next) => (...args) => {
  const { fieldName } = args[3];
  if (fieldName !== "login") {
    const { user } = args[2];
    if (!user) {
      throw new Error("You need to login to access this query");
    }
  }
  return next(...args);
};

module.exports = {
  encodeToken,
  encodePassword,
  decodeToken,
  decorateObject,
  authResolverDecorator
};