import moment, { Moment } from "moment";

export interface CursorRange {
  from: Moment,
  to?: Moment
};

export const makeNewCursor = (cursorRange: CursorRange): string => {
  return cursorRange.from.toISOString();
};

const unpackWeeklyCursor = (cursor: string): Moment | undefined => {
  if (!cursor) return;
  if (cursor) {
    const value = moment(cursor);
    if (value.isValid()) {
      return value;
    }
  }
  return;
};

export const getCursorRange = (cursor: string, limit: number): CursorRange => {
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
