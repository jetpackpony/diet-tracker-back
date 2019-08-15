const nano = require("nano");
const { COUCHDB_HOST, COUCHDB_PORT, COUCHDB_DB_NAME } = process.env;

const initDB = () => {
  return nano(`http://${COUCHDB_HOST}:${COUCHDB_PORT}`)
    .db.use(COUCHDB_DB_NAME);
};

module.exports = {
  initDB
};