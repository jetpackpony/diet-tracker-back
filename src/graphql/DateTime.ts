import { GraphQLDateTime } from "graphql-scalars";
import { arg, core, decorateType } from "nexus";
export const DateTime = decorateType(GraphQLDateTime, {
  sourceType: "Date",
  asNexusMethod: "date"
});

export function dateArg(opts?: core.ScalarArgConfig<Date>) {
  return arg({ type: "DateTime", ...opts });
};