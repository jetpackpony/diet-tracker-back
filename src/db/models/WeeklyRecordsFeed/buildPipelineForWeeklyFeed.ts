import type { Document } from "mongodb";
import type { CursorRange } from "./cursorHelpers.js";

export function buildPipelineForWeeklyFeed(cursorRange: CursorRange): Document[] {
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
