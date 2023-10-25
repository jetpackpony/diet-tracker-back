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

export const validateUser = (user: any): user is UserModel => {
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

export async function createOrUpdateUser(db: Db, { userName, password }: UserProps): Promise<UserModel> {
  if (userName == undefined) {
    throw new Error("App user name is not set. Won't connect to the DB like this!");
  }
  if (password == undefined) {
    throw new Error("App user password is not set. Won't connect to the DB like this!");
  }
  const user = await db.collection("users").findOne({ userName });
  if (!user || !validateUser(user)) {
    const inserted = await db.collection("users").insertOne({
      userName,
      passHash: encodePassword(password)
    });
    if (!inserted.insertedId) {
      throw new Error(`Failed to create a user "${userName}"!`);
    }
    const newUser = await db.collection("users").findOne({
      _id: inserted.insertedId
    });
    if (!validateUser(newUser)) {
      throw new Error("Failed to retrieve an inserted user!");
    }
    return newUser;
  }

  if (user.passHash !== encodePassword(password)) {
    const newUser = await db.collection("users")
      .findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          $set: {
            passHash: encodePassword(password)
          }
        },
        {
          returnDocument: "after"
        }
      );
    if (!newUser || !validateUser(newUser)) {
      throw new Error("Failed to update a default user!");
    }
    return newUser;
  }
  return user;
};