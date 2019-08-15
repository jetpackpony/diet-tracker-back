let foodItemsId = 2;
const foodItems = [
  {
    id: "food-0",
    title: "Cinnamon Rolls",
    calories: 670,
    protein: 12,
    fat: 45,
    carbs: 132,
  },
  {
    id: "food-1",
    title: "Yoghurt",
    calories: 270,
    protein: 54,
    fat: 24,
    carbs: 54,
  }
];

let recordsId = 4;
const records = [
  {
    id: "rec-0",
    foodItem: foodItems[0],
    weight: 155,
    eatenAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
    createdAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
  },
  {
    id: "rec-1",
    foodItem: foodItems[1],
    weight: 33,
    eatenAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
    createdAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
  },
  {
    id: "rec-2",
    foodItem: foodItems[0],
    weight: 111,
    eatenAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
    createdAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
  },
  {
    id: "rec-3",
    foodItem: foodItems[0],
    weight: 42,
    eatenAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
    createdAt: (new Date("28 Jul 2019 15:44:32")).toISOString(),
  },
];

const makeFoodItem = ({ title, calories, protein, fat, carbs }) => ({
  id: `food-${foodItemsId++}`,
  title,
  calories,
  protein,
  fat,
  carbs
});
const makeRecord = (foodItem, weight, createdAt, eatenAt) => ({
  id: `rec-${recordsId++}`,
  foodItem,
  weight,
  eatenAt,
  createdAt
});

const resolvers = {
  Query: {
    getAllRecords: () => records,
    getFoodItems: (root, { ids }, context) => (
      foodItems.filter((item) => ids.includes(item.id))
    )
  },
  Mutation: {
    addFoodItem: (root, args) => {
      const newItem = makeFoodItem(args);
      foodItems.push(newItem);
      return newItem;
    },
    addRecord: (root, args) => {
      const foodItem = foodItems.find((item) => item.id === args.foodItemId);
      const newRec = makeRecord(foodItem, args.weight, args.createdAt, args.eatenAt);
      records.push(newRec);
      return newRec;
    },
    addRecordWithFoodItem: (root, args) =>{
      const foodItem = makeFoodItem(args);
      foodItems.push(foodItem);
      const record = makeRecord(foodItem, args.weight, args.createdAt, args.eatenAt);
      records.push(record);
      return record;
    } 
  }
};

module.exports = { resolvers };