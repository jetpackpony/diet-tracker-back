const { DataSource } = require('apollo-datasource');
const ObjectID = require('mongodb').ObjectID;
const escapeRegEx = require("escape-string-regexp");
const moment = require("moment");
const { encodePassword, encodeToken } = require("../../authHelpers");

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

const unpackWeeklyCursor = (cursor) => {
  if (!cursor) return false;
  const value = moment(cursor);
  return value.isValid() ? value : false;
};
const buildPipelineForWeeklyFeed = (cursor, limit) => {
  const pipeline = [];
  let curs = unpackWeeklyCursor(cursor);
  if (curs) {
    pipeline.push(
      {
        $match: {
          $and: [
            { eatenAt: { $lte: curs.toDate() } },
            { eatenAt: { $gt: curs.clone().subtract(limit, "weeks").toDate() } },
          ]
        }
      }
    );
  } else {
    pipeline.push(
      {
        $match: {
          eatenAt: { $gt: moment().startOf("isoWeek").toDate() }
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
  pipeline.push({
    $addFields: {
      id: { $toString: "$_id" },
      "foodItem.id": { $toString: "$foodItem._id" },
    }
  });
  pipeline.push({
    $group: {
      _id: {
        $dateFromString: {
          dateString: {
            $dateToString: {
              date: "$eatenAt",
              format: "%Y-%m-%dT00:00:00.000Z"
            }
          }
        }
      },
      calories: { $sum: { $multiply: ["$weight", "$foodItem.calories", 0.01] } },
      protein: { $sum: { $multiply: ["$weight", "$foodItem.protein", 0.01] } },
      fat: { $sum: { $multiply: ["$weight", "$foodItem.fat", 0.01] } },
      carbs: { $sum: { $multiply: ["$weight", "$foodItem.carbs", 0.01] } },
      records: { $push: "$$ROOT" }
    }
  });
  pipeline.push({
    $sort: {
      _id: -1
    }
  });
  pipeline.push({
    $project: {
      totals: {
        calories: "$calories",
        protein: "$protein",
        fat: "$fat",
        carbs: "$carbs",
      },
      records: true,
    }
  });
  pipeline.push({
    $group: {
      _id: { isoWeek: { $isoWeek: "$_id" }, isoWeekYear: { $isoWeekYear: "$_id" } },
      calories: { $sum: "$totals.calories" },
      protein: { $sum: "$totals.protein" },
      fat: { $sum: "$totals.fat" },
      carbs: { $sum: "$totals.carbs" },
      days: { $push: "$$ROOT" }
    }
  });
  pipeline.push({
    $sort: {
      "_id.isoWeekYear": -1,
      "_id.isoWeek": -1,
    }
  });
  pipeline.push({
    $project: {
      totals: {
        calories: "$calories",
        protein: "$protein",
        fat: "$fat",
        carbs: "$carbs",
      },
      days: true,
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

  async totals({ startInterval, endInterval }) {
    const res = await this.db.collection('records')
      .aggregate([
        {
          $match: {
            $and: [
              { eatenAt: { $lte: moment(endInterval).toDate() } },
              { eatenAt: { $gt: moment(startInterval).toDate() } },
            ]
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
        },
        {
          $group: {
            _id: null,
            calories: { $sum: { $multiply: ["$weight", "$foodItem.calories", 0.01] } },
            protein: { $sum: { $multiply: ["$weight", "$foodItem.protein", 0.01] } },
            fat: { $sum: { $multiply: ["$weight", "$foodItem.fat", 0.01] } },
            carbs: { $sum: { $multiply: ["$weight", "$foodItem.carbs", 0.01] } }
          }
        }
      ])
      .toArray();
    return res[0];
  }

  async weeklyRecordsFeed(cursor = null, limit = 1) {
    const res = await this.db.collection("records")
      .aggregate(buildPipelineForWeeklyFeed(cursor, limit))
      .toArray()
      .then((weeks) => {
        return weeks.map((week) => {
          const weekStart = moment()
            .isoWeekYear(week._id.isoWeekYear)
            .isoWeek(week._id.isoWeek)
            .startOf("isoweek");
          const weekEnd = weekStart.clone().add(1, "week");
          return {
            weekStart: weekStart.toDate(),
            weekEnd: weekEnd.toDate(),
            totals: week.totals,
            days: week.days.map((day) => {
              const dayStart = moment(day._id);
              const dayEnd = dayStart.clone().add(24, "hours");
              return {
                dayStart: dayStart.toDate(),
                dayEnd: dayEnd.toDate(),
                totals: day.totals,
                records: day.records
              };
            })
          };
        });
      })
      .then((weeks) => {
        const last = weeks[weeks.length - 1];
        const newCursor =
          last
            ? last.weekStart.toISOString()
            : cursor;
        return {
          cursor: newCursor,
          weeks
        };
      });
    return res;
  }
}

module.exports = FoodJournalAPI;