const moment = require("moment");

const buildPipelineForWeeklyFeed = (cursorRange) => {
  const pipeline = [];
  if (cursorRange.to) {
    // If the end date is set, specify the range
    pipeline.push(
      {
        $match: {
          $and: [
            { eatenAt: { $lte: cursorRange.to.toDate() } },
            { eatenAt: { $gt: cursorRange.from.toDate() } },
          ]
        }
      }
    );
  } else {
    // If the end date is not set, get the records starting from current week and
    // into the future
    pipeline.push(
      {
        $match: {
          eatenAt: { $gt: cursorRange.from.toDate() }
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

const convertDayDates = (day) => {
  const dayStart = moment(day._id);
  const dayEnd = dayStart.clone().add(24, "hours");
  return {
    dayStart,
    dayEnd,
    totals: day.totals,
    records: day.records
  };
};

const cleanUpDayRecord = (day) => {
  return {
    dayStart: day.dayStart.toDate(),
    dayEnd: day.dayEnd.toDate(),
    totals: day.totals,
    records: day.records
  };
};
const makeBlankDay = (dayStart) => ({
  dayStart: dayStart.clone(),
  dayEnd: dayStart.clone().add(1, "day"),
  totals: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  },
  records: []
});

const padEmptyDays = (weekStart, weekEnd, days) => {
  const stepDate = weekStart.clone();
  const newDays = [];

  while(
    (stepDate.isBefore(weekEnd))
    && stepDate.isBefore(moment())
  ) {
    newDays.push(
      days.find((item) => item.dayStart.isSame(stepDate)) || makeBlankDay(stepDate)
    );
    stepDate.add(1, "day");
  }
  newDays.reverse();

  return newDays;
};

const convertWeekDates = (week) => {
  const weekStart = moment()
    .isoWeekYear(week._id.isoWeekYear)
    .isoWeek(week._id.isoWeek)
    .startOf("isoweek");
  const weekEnd = weekStart.clone().add(1, "week");
  return {
    weekStart: weekStart,
    weekEnd: weekEnd,
    totals: week.totals,
    days: week.days
  };
};

const cleanUpWeekRecord = (week) => {
  const days = week.days.map(convertDayDates);
  return {
    weekStart: week.weekStart.toDate(),
    weekEnd: week.weekEnd.toDate(),
    totals: week.totals,
    days: padEmptyDays(week.weekStart, week.weekEnd, days).map(cleanUpDayRecord)
  };
};

const addCursorsToResults = (oldCursor, weeks) => {
  const last = weeks[weeks.length - 1];
  const newCursor =
    last
      ? last.weekStart.toISOString()
      : oldCursor;
  return {
    cursor: newCursor,
    weeks
  };
};

const unpackWeeklyCursor = (cursor) => {
  if (!cursor) return false;
  const value = moment(cursor);
  return value.isValid() ? value : false;
};

const getCursorRange = (cursor, limit) => {
  let curs = unpackWeeklyCursor(cursor);
  if (curs) {
    // If the cursor is set, get only the records for specified weeks
    return {
      from: curs.clone().subtract(limit, "weeks"),
      to: curs
    };
  } else {
    // If the cursor is not set, get the records starting from current week and
    // into the future
    let date = moment();
    if (date.day() <= 2) {
      date = date.subtract(1, 'week');
    }
    return {
      from: date.startOf("week")
    };
  }
};

const makeBlankWeek = (weekStart) => ({
  weekStart: weekStart.clone(),
  weekEnd: weekStart.clone().add(1, "week"),
  totals: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  },
  days: []
});

const padEmptyWeeks = (range, weeks) => {
  // Either the end of range, or current time
  const rangeEnd = moment(range.to || undefined);
  const stepDate = range.from.clone();
  const newWeeks = [];

  while(stepDate.isBefore(rangeEnd)) {
    newWeeks.push(
      weeks.find((item) => item.weekStart.isSame(stepDate)) || makeBlankWeek(stepDate)
    );
    stepDate.add(1, "week");
  }
  newWeeks.reverse();

  return newWeeks;
};

module.exports = async function getWeeklyRecordsFeed(db, { cursor = null, limit = 1 }) {
  const cursorRange = getCursorRange(cursor, limit)
  const pipeline = buildPipelineForWeeklyFeed(cursorRange);
  return db.collection("records")
    .aggregate(pipeline)
    .toArray()
    .then((weeks) => {
      
      return padEmptyWeeks(cursorRange, weeks.map(convertWeekDates)).map(cleanUpWeekRecord);
    })
    .then((weeks) => addCursorsToResults(cursor, weeks));
};