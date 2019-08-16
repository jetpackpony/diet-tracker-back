const MongoClient = require('mongodb').MongoClient;
const {
  MONGO_APP_USERNAME, MONGO_APP_PASSWORD,
  MONGO_HOST, MONGO_PORT, MONGO_DB_NAME
} = process.env;

const url = `mongodb://${MONGO_APP_USERNAME}:${MONGO_APP_PASSWORD}` 
            + `@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}`;

const initDB = async () => {
  const client = new MongoClient(url, { useNewUrlParser: true });
  try {
    await client.connect();
    const db = client.db(MONGO_DB_NAME);
    return {
      db,
      client
    };
  } catch (err) {
    console.log("Couldn't connect to DB");
    console.log(err.stack);
    exit(1);
  }
}

module.exports = {
  initDB
};