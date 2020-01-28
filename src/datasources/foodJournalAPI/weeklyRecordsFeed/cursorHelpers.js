const moment = require("moment");

const makeNewCursor = (cursorRange) => {
  return cursorRange.from.toISOString();
};

const unpackWeeklyCursor = (cursor) => {
  if (!cursor) return false;
  const value = moment(cursor);
  return value.isValid() ? value : false;
};

const getCursorRange = (cursor, limit) => {
  let curs = unpackWeeklyCursor(cursor);
  if (curs) {
    // If the cursor is set, get only the records for specified weeks
    return {
      from: curs.clone().subtract(limit, "weeks"),
      to: curs
    };
  } else {
    // If the cursor is not set, get the records starting from current week and
    // into the future
    let date = moment();
    if (date.day() <= 2) {
      date = date.subtract(1, 'week');
    }
    return {
      from: date.startOf("week")
    };
  }
};

module.exports = { getCursorRange, makeNewCursor };