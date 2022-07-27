import { extendType, intArg, list, objectType, stringArg } from "nexus";
import { join } from "path";
import { withLogin } from "../authHelpers.js";
import { getWeeklyRecordsFeed } from "../db/models/index.js";

export const DayRecords = objectType({
  name: "DayRecords",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "DayRecordsModel"
  },
  definition(t) {
    t.field("dayStart", { type: "DateTime" });
    t.field("dayEnd", { type: "DateTime" });
    t.field("totals", { type: "Totals" });
    t.field("records", { type: list("Record") });
  }
});

export const WeekRecords = objectType({
  name: "WeekRecords",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "WeekRecordsModel"
  },
  definition(t) {
    t.field("weekStart", { type: "DateTime" });
    t.field("weekEnd", { type: "DateTime" });
    t.field("totals", { type: "Totals" });
    t.field("days", { type: list("DayRecords") });
  }
});

export const WeeklyRecordsFeed = objectType({
  name: "WeeklyRecordsFeed",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "WeeklyRecordsFeedModel"
  },
  definition(t) {
    t.string("cursor");
    t.field("weeks", { type: list("WeekRecords") });
  }
});

export const WeeklyRecordsFeedQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("weeklyRecordsFeed", {
      type: "WeeklyRecordsFeed",
      args: {
        cursor: stringArg(),
        limit: intArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return getWeeklyRecordsFeed(ctx.db, _args);
      })
    })
  }
});