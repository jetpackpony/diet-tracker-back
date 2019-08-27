const { DataSource } = require('apollo-datasource');
const ObjectID = require('mongodb').ObjectID;
const escapeRegEx = require("escape-string-regexp");
const moment = require("moment");
const { encodePassword, encodeToken } = require("../authHelpers");

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

const buildPipelineForRecords = (cursor, limit) => {
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

  async getRecords(cursor = null, limit = 50) {
    const res = await this.db.collection("records")
      .aggregate(buildPipelineForRecords(cursor, limit))
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

  async login({ userName, password }) {
    const user = await this.db.collection("users").findOne({ userName });
    if (!user) {
      throw new Error(`Can't find user "${userName}"`);
    }

    if (user.passHash !== encodePassword(password)) {
      throw new Error("Incorrect password");
    }

    const userObj = idsToStrings({ _id: user._id });
    return {
      user: userObj,
      token: encodeToken(userObj)
    };
  }
}

module.exports = FoodJournalAPI;