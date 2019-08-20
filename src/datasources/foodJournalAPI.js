const { DataSource } = require('apollo-datasource');
const ObjectID = require('mongodb').ObjectID;
const escapeRegEx = require("escape-string-regexp");

const idsToStrings = (item) => ({
  ...item,
  id: item._id.toString()
});

const buildRegexArray = (filter) => (
  filter
    .split(/\s/)
    .map(escapeRegEx)
    .map((str) => ({
      title: new RegExp(str, "i")
    }))
);

class FoodJournalAPI extends DataSource {
  constructor({ db }) {
    super();
    this.db = db;
  }

  /**
   * This is a function that gets called by ApolloServer when being setup.
   * This function gets called with the datasource config including things
   * like caches and context. We'll assign this.context to the request context
   * here, so we can know about the user making requests
   */
  initialize(config) {
    this.context = config.context;
  }

  async getRecords() {
    const res = await this.db.collection("records")
      .aggregate([{
        $lookup: {
          from: "foodItems",
          localField: "foodItemID",
          foreignField: "_id",
          as: "foodItem"
        }
      }])
      .toArray()
      .then(
        (recs) => recs.map(
          (rec) => ({
            ...idsToStrings(rec),
            foodItem: {
              ...idsToStrings(rec.foodItem[0])
            }
          })
        )
      );
    return res;
  }

  async getFoodItemsByIDs(ids) {
    return this.db.collection("foodItems")
      .find({ _id: { $in: ids.map(ObjectID) } })
      .toArray()
      .then((items) => items.map(idsToStrings));
  }

  async filterFoodItems({ filter, limit = 5 }) {
    return this.db.collection("foodItems")
      .find({
        $and: buildRegexArray(filter)
      })
      .limit(limit)
      .toArray()
      .then((items) => items.map(idsToStrings));
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
        { returnNewDocument: true }
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
}

module.exports = FoodJournalAPI;