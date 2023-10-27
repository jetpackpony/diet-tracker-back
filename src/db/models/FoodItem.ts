import { Db, ObjectId } from "mongodb";
import { validateObjectProperty } from "../../helpers.js";
import escapeRegEx from "escape-string-regexp";

export interface FoodItemModel extends FoodItemProps {
  _id: ObjectId
  userID: ObjectId
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
  validateObjectProperty(foodItem, "userID", ObjectId);
  validateObjectProperty(foodItem, "title", "string");
  validateObjectProperty(foodItem, "calories", "number");
  validateObjectProperty(foodItem, "protein", "number");
  validateObjectProperty(foodItem, "fat", "number");
  validateObjectProperty(foodItem, "carbs", "number");
  return foodItem;
};

export async function getFoodItems(db: Db, userID: string, limit = 5): Promise<FoodItemModel[]> {
  const docs = await db.collection("foodItems")
    .find({ userID: new ObjectId(userID) })
    .limit(limit)
    .toArray();
  return docs.filter(validateFoodItem);
};

export async function getFoodItemsByIDs(db: Db, userID: string, ids: string[] = [], limit = 5): Promise<FoodItemModel[]> {
  const docs = await db.collection("foodItems")
    .find({
      $and: [
        { userID: new ObjectId(userID) },
        { _id: { $in: ids.map((id) => new ObjectId(id)) } }
      ]
    })
    .limit(limit)
    .toArray();
  return docs.filter(validateFoodItem);
};

export async function insertFoodItem(db: Db, userID: string, foodItem: FoodItemProps): Promise<FoodItemModel> {
  const userIDObject = new ObjectId(userID);
  const res = await db.collection("foodItems").insertOne({
    userID: userIDObject,
    ...foodItem
  });
  return {
    _id: res.insertedId,
    userID: userIDObject,
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

export async function filterFoodItems(db: Db, userID: string, { filter, limit = 5 }: FilterFoodItemProps) {
  const docs = await db.collection("foodItems")
    .find({
      $and: [
        { userID: new ObjectId(userID) },
        ...buildRegexArray(filter)
      ]
    })
    .limit(limit)
    .toArray()
  return docs.filter(validateFoodItem);
};