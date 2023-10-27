import moment, { Moment } from "moment";
import { ObjectId, type Db, type Document } from "mongodb";
import { RecordModel, validateRecord } from "./Record.js";

export interface RecordFeedModel {
  cursor: string,
  records: RecordModel[]
};

interface FeedCursorSuccess {
  success: true,
  eatenAt: Moment,
  createdAt: Moment
};
interface FeedCursorFail {
  success: false
};
type FeedCursor = FeedCursorSuccess | FeedCursorFail;

const unpackCursor = (cursor: string): FeedCursor => {
  if (!cursor) {
    return { success: false };
  }
  const cursSplit = cursor.split("_");
  const eatenAt = moment(cursSplit[0]);
  const createdAt = moment(cursSplit[1]);
  if (!eatenAt.isValid() || !createdAt.isValid()) {
    return { success: false };
  }
  return {
    success: true,
    eatenAt,
    createdAt
  };
};

const buildPipeline = (userID: string, curs: FeedCursor, limit: number): Document[] => {
  const pipeline: Document[] = [];
  const conditions: Document[] = [
    { userID: new ObjectId(userID) }
  ];
  if (curs.success) {
    conditions.push(
      {
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
    );
  }
  pipeline.push(
    {
      $match: {
        $and: conditions
      }
    }
  );
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
  userID: string,
  { cursor = "", limit = 50 }
): Promise<RecordFeedModel> {
  const records = await db.collection("records")
    .aggregate(buildPipeline(userID, unpackCursor(cursor), limit))
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