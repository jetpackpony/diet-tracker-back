import moment, { Moment } from "moment";
import type { Document } from "mongodb";
import { validateObjectProperty } from "../../../helpers.js";
import { RecordModel, validateRecord } from "../Record.js";
import { TotalsModel, validateTotals } from "../Totals.js";
import type { CursorRange } from "./cursorHelpers.js";
import type { DayRecordsModel, WeekRecordsModel } from "./index.js";

interface DayRecordsRaw {
  _id: Date,
  totals: TotalsModel,
  records: RecordModel[]
};

interface WeekRecordsRaw {
  _id: { isoWeek: number, isoWeekYear: number },
  totals: TotalsModel,
  days: DayRecordsRaw[]
};

function validateDayRecordRaw(day: Document): day is DayRecordsRaw {
  validateObjectProperty(day, "_id", Date);
  validateTotals(day['totals']);
  validateObjectProperty(day, "records", Array);
  day['records'].map((r: Document) => validateRecord(r));
  return true;
};

export function validateWeekRecordRaw(week: Document): week is WeekRecordsRaw {
  validateObjectProperty(week['_id'], "isoWeek", "number");
  validateObjectProperty(week['_id'], "isoWeekYear", "number");
  validateTotals(week['totals']);
  validateObjectProperty(week, "days", Array);
  week['days'].map((d: Document) => validateDayRecordRaw(d));
  return true;
};

function convertDayRecords(day: DayRecordsRaw): DayRecordsModel {
  const dayStart = moment(day._id);
  if (!dayStart || !dayStart.isValid()) {
    throw new Error(`Couldn't parse a date for the DayRecord: "${day._id}"`);
  }
  const dayEnd = dayStart.clone().add(24, "hours");

  return {
    dayStart: dayStart.toDate(),
    dayEnd: dayEnd.toDate(),
    totals: day.totals,
    records: day.records
  };
};

export function convertWeekRecords(week: WeekRecordsRaw): WeekRecordsModel {
  const weekStart = moment()
    .isoWeekYear(week._id.isoWeekYear)
    .isoWeek(week._id.isoWeek)
    .startOf("isoWeek");
  if (!weekStart || !weekStart.isValid()) {
    throw new Error(`Couldn't parse a date for the WeekRecord: "${week._id}"`);
  }
  const weekEnd = weekStart.clone().add(1, "week");
  const days = week.days.map(convertDayRecords);
  return {
    weekStart: weekStart.toDate(),
    weekEnd: weekEnd.toDate(),
    totals: week.totals,
    days: days
  };
}

const makeBlankDay = (dayStart: Moment): DayRecordsModel => ({
  dayStart: dayStart.clone().toDate(),
  dayEnd: dayStart.clone().add(1, "day").toDate(),
  totals: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  },
  records: []
});

const makeBlankWeek = (weekStart: Moment): WeekRecordsModel => ({
  weekStart: weekStart.clone().toDate(),
  weekEnd: weekStart.clone().add(1, "week").toDate(),
  totals: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  },
  days: []
});

const padEmptyDays = (week: WeekRecordsModel): WeekRecordsModel => {
  const stepDate = moment(week.weekStart);
  const days = [];

  while((stepDate.isBefore(week.weekEnd)) && stepDate.isBefore(moment())) {
    const existingDay = week.days.find((item) => moment(item.dayStart).isSame(stepDate));
    days.push(existingDay || makeBlankDay(stepDate));
    stepDate.add(1, "day");
  }
  days.reverse();

  return {
    ...week,
    days
  };
};

export const padEmptyWeeks = (range: CursorRange, weeks: WeekRecordsModel[]): WeekRecordsModel[] => {
  // Either the end of range, or current time
  const rangeEnd = moment(range.to || undefined);
  const stepDate = range.from.clone();
  const newWeeks = [];

  while(stepDate.isBefore(rangeEnd)) {
    const existingWeek = weeks.find((item) => moment(item.weekStart).isSame(stepDate));
    newWeeks.push(padEmptyDays(existingWeek || makeBlankWeek(stepDate)));
    stepDate.add(1, "week");
  }
  newWeeks.reverse();

  return newWeeks;
};
