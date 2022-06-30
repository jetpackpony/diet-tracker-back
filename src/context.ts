import type { Db } from "mongodb";
import type { Session } from "./authHelpers.js";

export interface Context {
  db: Db,
  session: Session | undefined
};
