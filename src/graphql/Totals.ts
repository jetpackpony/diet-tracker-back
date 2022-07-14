import { extendType, objectType } from "nexus";
import { join } from "path";
import { withLogin } from "../authHelpers.js";
import { getTotals } from "../db/models/Totals.js";
import { dateArg } from "./DateTime.js";

export const Totals = objectType({
  name: "Totals",
  sourceType: {
    module: join(process.cwd(), "src/db/models/index.ts"),
    export: "TotalsModel"
  },
  definition(t) {
    t.float("calories");
    t.float("protein");
    t.float("fat");
    t.float("carbs");
  }
});

export const TotalsQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("totals", {
      type: "Totals",
      args: {
        startInterval: dateArg(),
        endInterval: dateArg()
      },
      resolve: withLogin(async function resolve(_root, _args, ctx) {
        return getTotals(ctx.db, _args);
      })
    });
  }
});