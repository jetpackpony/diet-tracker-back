import { extendType, floatArg, idArg, intArg, list, nullable, objectType, stringArg } from "nexus";
import { join } from "path";
import { withLogin } from "../authHelpers.js";
import { filterFoodItems, getFoodItems, getFoodItemsByIDs, insertFoodItem } from "../db/models/index.js";

export const FoodItem = objectType({
  name: "FoodItem",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "FoodItemModel"
  },
  definition(t) {
    t.id("id", {
      resolve(foodItem) {
        return foodItem._id.toString();
      }
    });
    t.id("userID", {
      resolve(foodItem) {
        return foodItem.userID.toString();
      }
    });
    t.string("title");
    t.float("calories");
    t.float("protein");
    t.float("fat");
    t.float("carbs");
  },
});

export const FoodItemQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("foodItems", {
      type: list("FoodItem"),
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return getFoodItems(ctx.db, ctx.session.userId);
      })
    });
    t.field("getFoodItems", {
      type: list("FoodItem"),
      args: {
        ids: list(idArg())
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return getFoodItemsByIDs(ctx.db, ctx.session.userId, _args.ids);
      })
    });
    t.field("filterFoodItems", {
      type: list("FoodItem"),
      args: {
        filter: stringArg(),
        limit: intArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return filterFoodItems(ctx.db, ctx.session.userId, _args);
      })
    });
  }
});

export const FoodItemMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("addFoodItem", {
      type: nullable("FoodItem"),
      args: {
        title: stringArg(),
        calories: floatArg(),
        protein: floatArg(),
        fat: floatArg(),
        carbs: floatArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return insertFoodItem(ctx.db, ctx.session.userId, _args);
      })
    });
  }
})