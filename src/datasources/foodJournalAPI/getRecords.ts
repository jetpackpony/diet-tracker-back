import moment from "moment";
import { idsToStrings } from "./helpers.js";

const unpackCursor = (cursor) => {
  if (!cursor) return { success: false };
  let [eatenAt, createdAt] = cursor.split("_");
  eatenAt = moment(eatenAt);
  createdAt = moment(createdAt);
  return {
    success: eatenAt.isValid() && createdAt.isValid,
    eatenAt,
    createdAt
  };
};

const buildPipeline = (cursor, limit) => {
  const pipeline = [];
  const curs = unpackCursor(cursor);
  if (curs.success) {
    pipeline.push(
      {
        $match: {
          $or: [
            { eatenAt: { $lt: curs.eatenAt.toDate() } },
            {
              $and: [
                { eatenAt: { $eq: curs.eatenAt.toDate() } },
                { createdAt: { $lt: curs.createdAt.toDate() } },
              ]
            }
          ]
        }
      }
    );
  }
  pipeline.push({
    $sort: {
      "eatenAt": -1,
      "createdAt": -1
    }
  });
  pipeline.push({
    $limit: limit
  });
  pipeline.push({
    $lookup: {
      from: "foodItems",
      localField: "foodItemID",
      foreignField: "_id",
      as: "foodItem"
    }
  });
  pipeline.push({
    $unwind: {
      path: "$foodItem",
      preserveNullAndEmptyArrays: false
    }
  });
  return pipeline;
};

export default async function getRecords(db, { cursor = null, limit = 50 }) {
  const res = await db.collection("records")
    .aggregate(buildPipeline(cursor, limit))
    .toArray()
    .then((recs) => {
      return recs.map(
        (rec) => ({
          ...idsToStrings(rec),
          foodItem: {
            ...idsToStrings(rec.foodItem)
          }
        })
      );
    })
    .then((recs) => {
      const last = recs[recs.length - 1];
      const newCursor =
        last
          ? `${last.eatenAt.toISOString()}_${last.createdAt.toISOString()}`
          : cursor;
      return {
        cursor: newCursor,
        records: recs
      };
    });
  return res;
}