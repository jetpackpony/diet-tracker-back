import type { Db } from "mongodb";
import { isSession, type Session } from "./authHelpers.js";

export interface Context {
  db: Db,
  session: Session | undefined
};

export interface ContextLoggedIn {
  db: Db,
  session: Session
};

export const isContextLoggedIn = (ctx: Context): ctx is ContextLoggedIn => {
  if (ctx.session !== undefined && isSession(ctx.session)) {
    return true;
  }
  return false;
};
