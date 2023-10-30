import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { validateObjectProperty } from "../../helpers.js";
import { FoodItemModel, getFoodItemsByIDs, validateFoodItem } from "./FoodItem.js";

export interface RecordModel {
  _id: ObjectId,
  userID: ObjectId,
  foodItem: FoodItemModel,
  weight: number,
  eatenAt: Date,
  createdAt: Date
};

export interface RecordCreateProps {
  foodItemID: string,
  weight: number,
  eatenAt: Date,
  createdAt: Date
};

export interface RecordModifyProps {
  id: string,
  foodItemID?: string,
  weight?: number,
  eatenAt?: Date,
  createdAt?: Date
};

export const validateRecord = (record: any): record is RecordModel => {
  validateObjectProperty(record, "_id", ObjectId);
  validateObjectProperty(record, "userID", ObjectId);
  validateObjectProperty(record, "weight", "number");
  validateObjectProperty(record, "eatenAt", Date);
  validateObjectProperty(record, "createdAt", Date);
  validateFoodItem(record.foodItem);
  return record;
};

export async function getRecordById(db: Db, userID: string, id: string): Promise<RecordModel | null> {
  const docs = await db.collection("records")
    .aggregate([
      {
        $match: {
          _id: new ObjectId(id),
          userID: new ObjectId(userID)
        }
      },
      {
        $lookup: {
          from: "foodItems",
          localField: "foodItemID",
          foreignField: "_id",
          as: "foodItem"
        }
      },
      {
        $unwind: {
          path: "$foodItem",
          preserveNullAndEmptyArrays: false
        }
      }

    ])
    .toArray();
  return docs.filter(validateRecord)[0] || null;
};

export async function addRecord(
  db: Db,
  userID: string,
  { foodItemID, weight, eatenAt, createdAt }: RecordCreateProps
): Promise<RecordModel> {
  const foodItem = await getFoodItemsByIDs(db, userID, [foodItemID], 1);
  if (foodItem.length < 1) {
    throw new Error(`Can't add a record for non-existing food item ${foodItemID} by user ${userID}`);
  }
  const inserted = await db.collection("records")
    .insertOne({
      userID: new ObjectId(userID),
      foodItemID: new ObjectId(foodItemID),
      weight,
      eatenAt,
      createdAt
    });
  const rec = await getRecordById(db, userID, inserted.insertedId.toString());
  if (!rec) {
    throw new Error("Couldn't create a new record");
  }
  return rec;
};

export async function updateRecord(
  db: Db,
  userID: string,
  { id, weight }: RecordModifyProps
): Promise<RecordModel> {
  const res = await db.collection("records")
    .findOneAndUpdate(
      { _id: new ObjectId(id), userID: new ObjectId(userID) },
      { $set: { weight } },
      { returnDocument: "after" }
    );
  if (!res.ok) {
    throw new Error("Couldn't update record");
  }

  const rec = await getRecordById(db, userID, id);
  if (!rec) {
    throw new Error(`Couldn't update record with id ${id} by user ${userID}`);
  }
  return rec;
};

export async function deleteRecord(db: Db, userID: string, id: string): Promise<string> {
  return db.collection("records")
    .deleteOne(
      {
        _id: new ObjectId(id),
        userID: new ObjectId(userID)
      },
    )
    .then(() => id)
    .catch(() => {
      throw new Error(`Couldn't delete record with id ${id} by user ${userID}`);
    });
};