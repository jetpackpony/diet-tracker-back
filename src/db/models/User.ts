import { Db, ObjectId } from "mongodb";
import { encodePassword, encodeToken } from "../../authHelpers.js";
import { validateObjectProperty } from "../../helpers.js";

export interface UserModel {
  _id: ObjectId,
  passHash: string,
  userName: string
}

export interface UserProps {
  userName: string,
  password: string
}

export interface LoginResultModel {
  user: UserModel,
  token: string
}

const validateUser = (user: any): user is UserModel => {
  validateObjectProperty(user, "_id", ObjectId);
  validateObjectProperty(user, "passHash", "string");
  validateObjectProperty(user, "userName", "string");
  return user;
};

export async function login(db: Db, { userName, password }: UserProps): Promise<LoginResultModel> {
  const user = await db.collection("users").findOne({ userName });
  if (!user) {
    throw new Error(`Can't find user "${userName}"`);
  }
  if (!validateUser(user)) {
    throw new Error(`User model is incorrect: "${userName}"`);
  }
  if (user.passHash !== encodePassword(password)) {
    throw new Error("Incorrect password");
  }
  const session = { userId: user._id.toString(), userName: user.userName };
  return {
    user,
    token: encodeToken(session).token
  };
};