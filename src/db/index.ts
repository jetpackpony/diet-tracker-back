import { MongoClient, MongoError } from 'mongodb';
const {
  MONGO_APP_USERNAME, MONGO_APP_PASSWORD,
  MONGO_HOST, MONGO_PORT, MONGO_DB_NAME,
} = process.env;

export const DBURL = `mongodb://${MONGO_APP_USERNAME}:${MONGO_APP_PASSWORD}`
  + `@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}`;

export const initDB = async () => {
  const client = new MongoClient(DBURL);
  try {
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
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
