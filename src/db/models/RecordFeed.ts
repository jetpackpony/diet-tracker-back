import moment from "moment";
import type { Db } from "mongodb";
import { RecordModel, validateRecord } from "./Record.js";

export interface RecordFeedModel {
  cursor: string,
  records: RecordModel[]
};

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

const buildPipeline = (curs, limit) => {
  const pipeline = [];
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

export async function getRecordFeed(
  db: Db,
  { cursor = "", limit = 50 }
): Promise<RecordFeedModel> {
  const records = await db.collection("records")
    .aggregate(buildPipeline(unpackCursor(cursor), limit))
    .toArray()
    .then((recs) => recs.filter(validateRecord));

  const last = records[records.length - 1];
  const newCursor = (
    last
      ? `${last.eatenAt.toISOString()}_${last.createdAt.toISOString()}`
      : cursor
  );
  return {
    cursor: newCursor,
    records
  };
};