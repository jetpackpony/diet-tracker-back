import moment from "moment";
import type { Db } from "mongodb"
import { validateObjectProperty } from "../../helpers.js";

export interface TotalsModel {
  calories: number,
  protein: number,
  fat: number,
  carbs: number
};

export interface TotalsProps {
  startInterval: Date,
  endInterval: Date
};

export const validateTotals = (totals: any): totals is TotalsModel => {
  validateObjectProperty(totals, "calories", "number");
  validateObjectProperty(totals, "protein", "number");
  validateObjectProperty(totals, "fat", "number");
  validateObjectProperty(totals, "carbs", "number");
  return totals;
};

export async function getTotals(
  db: Db,
  { startInterval, endInterval }: TotalsProps
): Promise<TotalsModel> {
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
    .toArray()
    .then((res) => res.filter(validateTotals));
  if (!res[0]) {
    throw new Error("Couldn't get totals");
  }
  return res[0];
};