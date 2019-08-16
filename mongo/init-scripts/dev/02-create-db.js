db.foodItems.insertMany([
  {
    _id: 1,
    title: "Cinnamon Rolls",
    calories: 670,
    protein: 12,
    fat: 45,
    carbs: 132
  },
  {
    _id: 2,
    title: "Yoghurt",
    calories: 270,
    protein: 54,
    fat: 24,
    carbs: 54
  }
]);

db.records.insertMany([
  {
    "foodItem": 1,
    "weight": 155,
    "eatenAt": (new Date("28 Jul 2019 15:44:32")).toISOString(),
    "createdAt": (new Date("28 Jul 2019 15:44:32")).toISOString(),
  },
  {
    "foodItem": 1,
    "weight": 33,
    "eatenAt": (new Date("28 Jul 2019 15:44:32")).toISOString(),
    "createdAt": (new Date("28 Jul 2019 15:44:32")).toISOString(),
  },
  {
    "foodItem": 2,
    "weight": 111,
    "eatenAt": (new Date("28 Jul 2019 15:44:32")).toISOString(),
    "createdAt": (new Date("28 Jul 2019 15:44:32")).toISOString(),
  }
]);