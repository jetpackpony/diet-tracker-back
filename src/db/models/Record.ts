import type { Db } from "mongodb";
import { ObjectId } from "mongodb";
import { validateObjectProperty } from "../../helpers.js";
import { FoodItemModel, validateFoodItem } from "./FoodItem.js";

export interface RecordModel {
  _id: ObjectId,
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
  validateObjectProperty(record, "weight", "number");
  validateObjectProperty(record, "eatenAt", Date);
  validateObjectProperty(record, "createdAt", Date);
  validateFoodItem(record.foodItem);
  return record;
};

export async function getRecordById(db: Db, id: string): Promise<RecordModel | null> {
  const docs = await db.collection("records")
    .aggregate([
      {
        $match: {
          _id: new ObjectId(id)
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
  { foodItemID, weight, eatenAt, createdAt }: RecordCreateProps
): Promise<RecordModel> {
  const inserted = await db.collection("records")
    .insertOne({
      foodItemID: new ObjectId(foodItemID),
      weight,
      eatenAt,
      createdAt
    });
  const rec = await getRecordById(db, inserted.insertedId.toString());
  if (!rec) {
    throw new Error("Couldn't create a new record");
  }
  return rec;
};

export async function updateRecord(
  db: Db,
  { id, weight }: RecordModifyProps
): Promise<RecordModel> {
  const res = await db.collection("records")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { weight } },
      { returnDocument: "after" }
    );
  if (!res.ok) {
    throw new Error("Couldn't update record");
  }

  const rec = await getRecordById(db, id);
  if (!rec) {
    throw new Error(`Couldn't get record with id ${id}`);
  }
  return rec;
};

export async function deleteRecord(db: Db, id: string): Promise<string> {
  return db.collection("records")
    .deleteOne(
      { _id: new ObjectId(id) },
    )
    .then(() => id);
};