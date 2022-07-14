import { Db, ObjectId } from "mongodb";
import { validateObjectProperty } from "../../helpers.js";
import escapeRegEx from "escape-string-regexp";

export interface FoodItemModel extends FoodItemProps {
  _id: ObjectId
};

export interface FoodItemProps {
  title: string,
  calories: number,
  protein: number,
  fat: number,
  carbs: number,
};

export const validateFoodItem = (foodItem: any): foodItem is FoodItemModel => {
  validateObjectProperty(foodItem, "_id", ObjectId);
  validateObjectProperty(foodItem, "title", "string");
  validateObjectProperty(foodItem, "calories", "number");
  validateObjectProperty(foodItem, "protein", "number");
  validateObjectProperty(foodItem, "fat", "number");
  validateObjectProperty(foodItem, "carbs", "number");
  return foodItem;
};

export async function getFoodItems(db: Db, limit = 5): Promise<FoodItemModel[]> {
  const docs = await db.collection("foodItems")
    .find()
    .limit(limit)
    .toArray();
  return docs.filter(validateFoodItem);
};

export async function getFoodItemsByIDs(db: Db, ids: string[] = [], limit = 5): Promise<FoodItemModel[]> {
  const docs = await db.collection("foodItems")
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } })
    .limit(limit)
    .toArray();
  return docs.filter(validateFoodItem);
};

export async function insertFoodItem(db: Db, foodItem: FoodItemProps): Promise<FoodItemModel> {
  const res = await db.collection("foodItems").insertOne(foodItem);
  return {
    _id: res.insertedId,
    ...foodItem
  };
};

const buildRegexArray = (filter: string) => (
  filter
    .split(/\s/)
    .map(escapeRegEx)
    .map((str: string) => ({
      title: new RegExp(str, "i")
    }))
);

export interface FilterFoodItemProps {
  filter: string,
  limit?: number
};

export async function filterFoodItems(db: Db, { filter, limit = 5 }: FilterFoodItemProps) {
  const docs = await db.collection("foodItems")
    .find({
      $and: buildRegexArray(filter)
    })
    .limit(limit)
    .toArray()
  return docs.filter(validateFoodItem);
};