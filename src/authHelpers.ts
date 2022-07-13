import crypto from 'crypto';
import jwt from "jsonwebtoken";
import type { Context } from './context';
import { validateObjectProperty } from './helpers.js';

export interface Session {
  userId: string,
  userName: string
}

export interface EncodeResult {
  token: string
}

export type DecodeResult = Session | undefined;

const JWT_SECRET = process.env["JWT_SECRET"] || "";
export const encodeToken = (payload: Session): EncodeResult => {
  return { token: jwt.sign(payload, JWT_SECRET) };
};

const isSession = (session: any): session is Session => {
  validateObjectProperty(session, "userId", "string");
  validateObjectProperty(session, "userName", "string");
  return session;
};

export const decodeToken = (token: string): DecodeResult => {
  try {
    const payload = jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    if (isSession(payload)) {
      return payload;
    } else {
      return undefined;
    }
  } catch (e) {
    return undefined;
  }
};

const PASS_SECRET = process.env["PASS_SECRET"] || "";
export const encodePassword = (password: string): string => {
  return crypto
    .createHmac('sha256', PASS_SECRET)
    .update(password)
    .digest('hex');
}

/**
 * Wrapper for resolvers to check user's login status. If the user is logged in
 * the passed resolver is called. Otherwise, it throws an error
 * @param next - resolver to wrap
 * @returns 
 */
export const withLogin =
  <A, B, C>(next: (_root: A, _args: B, ctx: Context) => C) =>
    (_root: A, _args: B, ctx: Context): C => {
      if (!ctx.session) {
        throw new Error("You need to login to access this query");
      }
      return next(_root, _args, ctx);
    };