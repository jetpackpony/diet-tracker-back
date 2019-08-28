const moment = require("moment");

module.exports = async function totals(db, { startInterval, endInterval }) {
  const res = await db.collection('records')
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
};