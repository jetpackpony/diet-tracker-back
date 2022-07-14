import { Db, MongoClient, MongoError } from 'mongodb';
import { encodePassword } from "../authHelpers.js";
import { UserModel, validateUser } from './models/User.js';
const {
  MONGO_APP_USERNAME, MONGO_APP_PASSWORD,
  MONGO_HOST, MONGO_PORT, MONGO_DB_NAME,
  APP_USER_NAME, APP_USER_PASSWORD
} = process.env;

const url = `mongodb://${MONGO_APP_USERNAME}:${MONGO_APP_PASSWORD}`
  + `@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}`;

const createOrUpdateDefaultUser = async (db: Db): Promise<UserModel> => {
  if (APP_USER_NAME == undefined) {
    throw new Error("App user name is not set. Won't connect to the DB like this!");
  }
  if (APP_USER_PASSWORD == undefined) {
    throw new Error("App user password is not set. Won't connect to the DB like this!");
  }
  const user = await db.collection("users").findOne({
    userName: APP_USER_NAME
  });
  if (!user || !validateUser(user)) {
    console.log("Couldn't find default user. Creating...");
    const inserted = await db.collection("users").insertOne({
      userName: APP_USER_NAME,
      passHash: encodePassword(APP_USER_PASSWORD)
    });
    if (!inserted.insertedId) {
      throw new Error("Failed to create a default user!");
    }
    const newUser = await db.collection("users").findOne({
      _id: inserted.insertedId
    });
    if (!validateUser(newUser)) {
      throw new Error("Failed to retrieve an inserted user!");
    }
    return newUser;
  }

  if (user.passHash !== encodePassword(APP_USER_PASSWORD)) {
    console.log("Password for default user didn't match. Updating...");
    const newUser = await db.collection("users")
      .findOneAndUpdate(
        {
          _id: user._id,
        },
        {
          $set: {
            passHash: encodePassword(APP_USER_PASSWORD)
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
  console.log("Default user exists. All good.");
  return user;
};

export const initDB = async () => {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    await createOrUpdateDefaultUser(db);
    return db;
  } catch (err) {
    console.error("Couldn't connect to DB");
    if (err instanceof MongoError) {
      console.error("MongoDB error: ", err.message);
    } else if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    return;
  }
};
