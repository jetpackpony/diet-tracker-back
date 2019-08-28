const escapeRegEx = require("escape-string-regexp");
const { idsToStrings } = require("./helpers");

const buildRegexArray = (filter) => (
  filter
    .split(/\s/)
    .map(escapeRegEx)
    .map((str) => ({
      title: new RegExp(str, "i")
    }))
);

module.exports = async function filterFoodItems(db, { filter, limit = 5 }) {
  return db.collection("foodItems")
    .find({
      $and: buildRegexArray(filter)
    })
    .limit(limit)
    .toArray()
    .then((items) => items.map(idsToStrings));
};