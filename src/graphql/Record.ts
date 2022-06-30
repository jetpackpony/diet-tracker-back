import { extendType, floatArg, idArg, intArg, list, nonNull, nullable, objectType, stringArg } from "nexus";
import { join } from "path";
import { withLogin } from "../authHelpers.js";
import { addRecord, deleteRecord, getRecordById, insertFoodItem, updateRecord, getRecordFeed } from "../db/models/index.js";
import { dateArg } from "./DateTime.js";

export const Record = objectType({
  name: "Record",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "RecordModel"
  },
  definition(t) {
    t.id("id", {
      resolve(record) {
        return record._id.toString();
      }
    });
    t.int("weight");
    t.field("foodItem", { type: nonNull("FoodItem") });
    t.field("eatenAt", { type: nonNull("DateTime") });
    t.field("createdAt", { type: nonNull("DateTime") });
  }
});

export const RecordFeed = objectType({
  name: "RecordFeed",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "RecordFeedModel"
  },
  definition(t) {
    t.string("cursor");
    t.field("records", { type: list(nullable("Record")) })
  }
});

export const RecordQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("getRecord", {
      type: nullable("Record"),
      args: {
        id: idArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return getRecordById(ctx.db, _args.id);
      })
    });
    t.field("getAllRecords", {
      type: list(nullable("Record")),
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return (await getRecordFeed(ctx.db, {})).records;
      })
    });
    t.field("recordsFeed", {
      type: "RecordFeed",
      args: {
        cursor: stringArg(),
        limit: intArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return getRecordFeed(ctx.db, _args);
      })
    });
  }
});

export const RecordMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("addRecord", {
      type: "Record",
      args: {
        foodItemID: idArg(),
        weight: intArg(),
        eatenAt: dateArg(),
        createdAt: dateArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return addRecord(ctx.db, _args);
      })
    });
    t.field("addRecordWithFoodItem", {
      type: "Record",
      args: {
        title: stringArg(),
        calories: floatArg(),
        protein: floatArg(),
        fat: floatArg(),
        carbs: floatArg(),
        weight: intArg(),
        eatenAt: dateArg(),
        createdAt: dateArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        const foodItem = await insertFoodItem(ctx.db, _args);
        return addRecord(ctx.db, {
          foodItemID: foodItem._id.toString(),
          ..._args
        });
      })
    });
    t.field("updateRecord", {
      type: "Record",
      args: {
        id: idArg(),
        weight: intArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return updateRecord(ctx.db, _args);
      })
    });
    t.field("deleteRecord", {
      type: "ID",
      args: {
        id: idArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return deleteRecord(ctx.db, _args.id);
      })
    });
  }
});