const R = require("ramda");
const moment = require("moment");

const makeBlankWeek = (weekStart) => ({
  weekStart: weekStart.clone(),
  weekEnd: weekStart.clone().add(1, "week"),
  totals: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  },
  days: []
});

const makeBlankDay = (dayStart) => ({
  dayStart: dayStart.clone(),
  dayEnd: dayStart.clone().add(1, "day"),
  totals: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  },
  records: []
});

const padEmptyDays = R.curry((weekStart, weekEnd, days) => {
  const stepDate = weekStart.clone();
  const newDays = [];

  while(
    (stepDate.isBefore(weekEnd))
    && stepDate.isBefore(moment())
  ) {
    newDays.push(
      days.find((item) => item.dayStart.isSame(stepDate)) || makeBlankDay(stepDate)
    );
    stepDate.add(1, "day");
  }
  newDays.reverse();

  return newDays;
});

const padEmptyWeeks = R.curry((range, weeks) => {
  // Either the end of range, or current time
  const rangeEnd = moment(range.to || undefined);
  const stepDate = range.from.clone();
  const newWeeks = [];

  while(stepDate.isBefore(rangeEnd)) {
    newWeeks.push(
      weeks.find((item) => item.weekStart.isSame(stepDate)) || makeBlankWeek(stepDate)
    );
    stepDate.add(1, "week");
  }
  newWeeks.reverse();

  return newWeeks;
});

const convertDayDates = (day) => {
  const dayStart = moment(day._id);
  const dayEnd = dayStart.clone().add(24, "hours");
  return {
    ...day,
    dayStart,
    dayEnd
  };
};

const convertDates = (week) => {
  const weekStart = moment()
    .isoWeekYear(week._id.isoWeekYear)
    .isoWeek(week._id.isoWeek)
    .startOf("isoweek");
  const weekEnd = weekStart.clone().add(1, "week");
  const days = week.days.map(convertDayDates);
  return {
    weekStart: weekStart,
    weekEnd: weekEnd,
    totals: week.totals,
    days: days
  };
};

const cleanUpDayRecord = (day) => {
  return {
    dayStart: day.dayStart.toDate(),
    dayEnd: day.dayEnd.toDate(),
    totals: day.totals,
    records: day.records
  };
};

const cleanUpWeekRecord = (week) => {
  const days = R.compose(
    R.map(cleanUpDayRecord),
    padEmptyDays(week.weekStart, week.weekEnd)
  )(week.days);
  return {
    weekStart: week.weekStart.toDate(),
    weekEnd: week.weekEnd.toDate(),
    totals: week.totals,
    days
  };
};

const cleanUpFeed = (cursorRange, weeks) => {
  return R.compose(
    R.map(cleanUpWeekRecord),
    padEmptyWeeks(cursorRange),
    R.map(convertDates)
  )(weeks);
};

module.exports = cleanUpFeed;