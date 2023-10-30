import type { Db } from "mongodb";
import type { RecordModel } from "../Record.js";
import type { TotalsModel } from "../Totals.js";
import { buildPipelineForWeeklyFeed } from "./buildPipelineForWeeklyFeed.js";
import { getCursorRange, makeNewCursor } from "./cursorHelpers.js";
import { convertWeekRecords, padEmptyWeeks, validateWeekRecordRaw } from "./cleanUpFeed.js";

export interface DayRecordsModel {
  dayStart: Date,
  dayEnd: Date,
  totals: TotalsModel,
  records: RecordModel[]
};

export interface WeekRecordsModel {
  weekStart: Date,
  weekEnd: Date,
  totals: TotalsModel,
  days: DayRecordsModel[]
};

export interface WeeklyRecordsFeedModel {
  cursor: string,
  weeks: WeekRecordsModel[]
};

export async function getWeeklyRecordsFeed(
  db: Db,
  userID: string,
  { cursor = "", limit = 1 }
): Promise<WeeklyRecordsFeedModel> {
  const cursorRange = getCursorRange(cursor, limit);
  const pipeline = buildPipelineForWeeklyFeed(userID, cursorRange);
  const weeks = await db.collection("records")
    .aggregate(pipeline)
    .toArray()
    .then((weeks) => weeks.filter(validateWeekRecordRaw))
    .then((weeks) => weeks.map(convertWeekRecords))
    .then((weeks) => padEmptyWeeks(cursorRange, weeks));
  return {
    cursor: makeNewCursor(cursorRange),
    weeks
  };
};