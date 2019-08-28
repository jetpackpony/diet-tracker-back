const { DataSource } = require('apollo-datasource');
const ObjectID = require('mongodb').ObjectID;
const { idsToStrings } = require("./helpers");
const getWeeklyRecordsFeed = require("./weeklyRecordsFeed");
const totals = require("./totals");
const getRecords = require("./getRecords");
const login = require("./login");
const filterFoodItems = require("./filterFoodItems");

class FoodJournalAPI extends DataSource {
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
      .insert({ title, calories, protein, fat, carbs })
      .then((res) => ({ id: res.insertedIds[0].toString() }));
  }

  async createRecord({ foodItemID, weight, eatenAt, createdAt }) {
    return this.db.collection("records")
      .insert({ foodItemID: ObjectID(foodItemID), weight, eatenAt, createdAt })
      .then((res) => ({ id: res.insertedIds[0].toString() }));
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

module.exports = FoodJournalAPI;