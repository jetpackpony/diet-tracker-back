import { DataSource } from 'apollo-datasource';
import mongodb from 'mongodb';
import { idsToStrings } from "./helpers.js";
import getWeeklyRecordsFeed from "./weeklyRecordsFeed/index.js";
import totals from "./totals.js";
import getRecords from "./getRecords.js";
import login from "./login.js";
import filterFoodItems from "./filterFoodItems.js";

const ObjectID = mongodb.ObjectID;

export default class FoodJournalAPI extends DataSource {
  constructor({ db }) {
    super();
    this.db = db;
  }

  initialize(config) {
    this.context = config.context;
  }

  async getRecords(args) {
    return getRecords(this.db, args);
  }

  async getFoodItemsByIDs(ids) {
    return this.db.collection("foodItems")
      .find({ _id: { $in: ids.map(ObjectID) } })
      .toArray()
      .then((items) => items.map(idsToStrings));
  }

  async filterFoodItems(args) {
    return filterFoodItems(this.db, args);
  }

  async createFoodItem({ title, calories, protein, fat, carbs }) {
    return this.db.collection("foodItems")
      .insertOne({ title, calories, protein, fat, carbs })
      .then((res) => ({ id: res.insertedId.toString() }));
  }

  async getRecordById({ id }) {
    const res = await this.db.collection("records")
      .aggregate([
        {
          $match: {
            _id: ObjectID(id)
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
      .then((recs) => recs[0] || null)
    return res;
  }

  async createRecord({ foodItemID, weight, eatenAt, createdAt }) {
    return this.db.collection("records")
      .insertOne({ foodItemID: ObjectID(foodItemID), weight, eatenAt, createdAt })
      .then((res) => (res.insertedId))
      .then((recId) => {
        return this.getRecordById(recId)
      });
  }

  async createRecordWithFoodItem({
    title, calories, protein, fat, carbs,
    weight, eatenAt, createdAt,
  }) {
    const { id: foodItemID } = await this.createFoodItem({
      title,
      calories,
      protein,
      fat,
      carbs
    });
    return this.createRecord({
      foodItemID: ObjectID(foodItemID),
      weight,
      eatenAt,
      createdAt
    });
  }

  async updateRecord({ id, weight }) {
    return this.db.collection("records")
      .findOneAndUpdate(
        { _id: ObjectID(id)},
        { $set: { weight }},
        { returnOriginal : false }
      )
      .then((rec) => {
        return idsToStrings(rec.value);
      });
  }

  async deleteRecord(id) {
    return this.db.collection("records")
      .deleteOne(
        { _id: ObjectID(id)},
      )
      .then(() => id);
  }

  async login(args) {
    return login(this.db, args);
  }

  async totals(args) {
    return totals(this.db, args);
  }

  async weeklyRecordsFeed(args) {
    return getWeeklyRecordsFeed(this.db, args);
  }
}
