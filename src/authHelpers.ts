import crypto from 'crypto';
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env["JWT_SECRET"] || "";
export const encodeToken = (payload: string | object | Buffer) => {
  return jwt.sign(payload, JWT_SECRET);
};

export const decodeToken = (token: string) => {
  try {
    const payload = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    return payload;
  } catch(e) {
    return null;
  }
};

const PASS_SECRET = process.env["PASS_SECRET"] || "";
export const encodePassword = (password: string) : string => {
  return crypto
    .createHmac('sha256', PASS_SECRET)
    .update(password)
    .digest('hex');
}

export function decorateObject(obj, cb) {
  if (typeof obj === "object" && obj !== null) {
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

export const authResolverDecorator = (next) => (...args) => {
  const { fieldName } = args[3];
  if (fieldName !== "login") {
    const { user } = args[2];
    if (!user) {
      throw new Error("You need to login to access this query");
    }
  }
  return next(...args);
};
