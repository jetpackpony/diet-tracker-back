import escapeRegEx from "escape-string-regexp";
import { Db } from "mongodb";
import { idsToStrings } from "./helpers.js";

const buildRegexArray = (filter: string) => (
  filter
    .split(/\s/)
    .map(escapeRegEx)
    .map((str: string) => ({
      title: new RegExp(str, "i")
    }))
);

export default async function filterFoodItems(db: Db, { filter, limit = 5 }) {
  return db.collection("foodItems")
    .find({
      $and: buildRegexArray(filter)
    })
    .limit(limit)
    .toArray()
    .then((items) => items.map(idsToStrings));
};