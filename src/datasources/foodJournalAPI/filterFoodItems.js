import escapeRegEx from "escape-string-regexp";
import { idsToStrings } from "./helpers.js";

const buildRegexArray = (filter) => (
  filter
    .split(/\s/)
    .map(escapeRegEx)
    .map((str) => ({
      title: new RegExp(str, "i")
    }))
);

export default async function filterFoodItems(db, { filter, limit = 5 }) {
  return db.collection("foodItems")
    .find({
      $and: buildRegexArray(filter)
    })
    .limit(limit)
    .toArray()
    .then((items) => items.map(idsToStrings));
};