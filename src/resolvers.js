const resolvers = {
  Query: {
    getAllRecords: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.getRecords();
    },
    getFoodItems: (root, { ids }, { dataSources }) => (
      dataSources.foodJournalAPI.getFoodItemsByIDs(ids)
    )
  },
  Mutation: {
    addFoodItem: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.createFoodItem(args);
    },
    addRecord: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.createRecord(args);
    },
    addRecordWithFoodItem: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.createRecordWithFoodItem(args);
    },
    updateRecord: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.updateRecord(args);
    }
  }
};

module.exports = { resolvers };