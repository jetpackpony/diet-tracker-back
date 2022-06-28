import { encodePassword, encodeToken } from "../../authHelpers.js";
import { idsToStrings } from "./helpers.js";

export default async function login(db, { userName, password }) {
  const user = await db.collection("users").findOne({ userName });
  if (!user) {
    throw new Error(`Can't find user "${userName}"`);
  }

  if (user.passHash !== encodePassword(password)) {
    throw new Error("Incorrect password");
  }

  const userObj = idsToStrings({ _id: user._id });
  return {
    user: userObj,
    token: encodeToken(userObj)
  };
};