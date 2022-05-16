import buildPipelineForWeeklyFeed from "./buildPipelineForWeeklyFeed.js";
import cleanUpFeed from "./cleanUpFeed.js";
import { getCursorRange, makeNewCursor } from "./cursorHelpers.js";

export default async function getWeeklyRecordsFeed(db, { cursor = null, limit = 1 }) {
  const cursorRange = getCursorRange(cursor, limit)
  const pipeline = buildPipelineForWeeklyFeed(cursorRange);
  const weeks = await db.collection("records").aggregate(pipeline).toArray();
  const feed = cleanUpFeed(cursorRange, weeks);
  return {
    cursor: makeNewCursor(cursorRange),
    weeks: feed
  };
};
