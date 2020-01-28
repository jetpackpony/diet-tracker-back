const buildPipelineForWeeklyFeed = require("./buildPipelineForWeeklyFeed");
const cleanUpFeed = require("./cleanUpFeed");
const { getCursorRange, makeNewCursor } = require("./cursorHelpers");

async function getWeeklyRecordsFeed(db, { cursor = null, limit = 1 }) {
  const cursorRange = getCursorRange(cursor, limit)
  const pipeline = buildPipelineForWeeklyFeed(cursorRange);
  const weeks = await db.collection("records").aggregate(pipeline).toArray();
  const feed = cleanUpFeed(cursorRange, weeks);
  return {
    cursor: makeNewCursor(cursorRange),
    weeks: feed
  };
};

module.exports = getWeeklyRecordsFeed;