const MongoClient = require('mongodb').MongoClient;
const {
  MONGO_APP_USERNAME, MONGO_APP_PASSWORD,
  MONGO_HOST, MONGO_PORT, MONGO_DB_NAME,
  APP_USER_NAME, APP_USER_PASSWORD
} = process.env;
const { encodePassword } = require("../authHelpers");

const url = `mongodb://${MONGO_APP_USERNAME}:${MONGO_APP_PASSWORD}` 
            + `@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}`;

const createOrUpdateDefaultUser = async (db) => {
  const user = await db.collection("users").findOne({
    userName: APP_USER_NAME
  });
  if (!user) {
    console.log("Couldn't find default user. Creating...");
    const newUser = await db.collection("users").insertOne({
      userName: APP_USER_NAME,
      passHash: encodePassword(APP_USER_PASSWORD)
    });
    if (!newUser) {
      throw new Error("Failed to create a default user!");
    }
    return newUser;
  }

  if (user.passHash !== encodePassword(APP_USER_PASSWORD)) {
    console.log("Password for default user didn't match. Updating...");
    const newUser = await db.collection("users")
      .updateOne({
        _id: user._id,
      }, {
          $set: {
            passHash: encodePassword(APP_USER_PASSWORD)
          }
        }
      );
    if (!newUser) {
      throw new Error("Failed to update a default user!");
    }
    return newUser;
  }
  console.log("Default user exists. All good.");
  return user;
};

const initDB = async () => {
  const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    await createOrUpdateDefaultUser(db);
    return {
      db,
      client
    };
  } catch (err) {
    console.log("Couldn't connect to DB");
    console.log(err.stack);
    exit(1);
  }
};

module.exports = {
  initDB
};