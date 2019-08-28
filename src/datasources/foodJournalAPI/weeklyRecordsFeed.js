const moment = require("moment");

const unpackWeeklyCursor = (cursor) => {
  if (!cursor) return false;
  const value = moment(cursor);
  return value.isValid() ? value : false;
};

const buildPipelineForWeeklyFeed = (cursor, limit) => {
  const pipeline = [];
  let curs = unpackWeeklyCursor(cursor);
  if (curs) {
    // If the cursor is set, get only the records for specified weeks
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
    // If the cursor is not set, get the records starting from current week and
    // into the future
    pipeline.push(
      {
        $match: {
          eatenAt: { $gt: moment().startOf("isoWeek").toDate() }
        }
      }
    );
  }
  // Sort records to put the latest on top
  pipeline.push({
    $sort: {
      "eatenAt": -1,
      "createdAt": -1
    }
  });
  // Join corresponding food items to records
  pipeline.push({
    $lookup: {
      from: "foodItems",
      localField: "foodItemID",
      foreignField: "_id",
      as: "foodItem"
    }
  });
  // Unwind food items since we only have one per record
  pipeline.push({
    $unwind: {
      path: "$foodItem",
      preserveNullAndEmptyArrays: false
    }
  });
  // Convert _id fields into strings
  pipeline.push({
    $addFields: {
      id: { $toString: "$_id" },
      "foodItem.id": { $toString: "$foodItem._id" },
    }
  });
  // Group records by day they are eaten and calculate totals for each day
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
  // Sort days after grouping
  pipeline.push({
    $sort: {
      _id: -1
    }
  });
  // Update field structure to put all totals on a separate object
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
  // Group all days by weeks and calculate totals for each week
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
  // Sort weeks
  pipeline.push({
    $sort: {
      "_id.isoWeekYear": -1,
      "_id.isoWeek": -1,
    }
  });
  // Update field structure to put all totals on a separate object
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

const cleanUpDayRecord = (day) => {
  const dayStart = moment(day._id);
  const dayEnd = dayStart.clone().add(24, "hours");
  return {
    dayStart: dayStart.toDate(),
    dayEnd: dayEnd.toDate(),
    totals: day.totals,
    records: day.records
  };
};

const cleanUpWeekRecord = (week) => {
  const weekStart = moment()
    .isoWeekYear(week._id.isoWeekYear)
    .isoWeek(week._id.isoWeek)
    .startOf("isoweek");
  const weekEnd = weekStart.clone().add(1, "week");
  return {
    weekStart: weekStart.toDate(),
    weekEnd: weekEnd.toDate(),
    totals: week.totals,
    days: week.days.map(cleanUpDayRecord)
  };
};

const addCursorsToResults = (weeks) => {
  const last = weeks[weeks.length - 1];
  const newCursor =
    last
      ? last.weekStart.toISOString()
      : cursor;
  return {
    cursor: newCursor,
    weeks
  };
};

module.exports = async function getWeeklyRecordsFeed(db, { cursor = null, limit = 1 }) {
  return db.collection("records")
    .aggregate(buildPipelineForWeeklyFeed(cursor, limit))
    .toArray()
    .then((weeks) => weeks.map(cleanUpWeekRecord))
    .then(addCursorsToResults);
};