const { authResolverDecorator, decorateObject } = require("./authHelpers");

const resolvers = {
  Query: {
    getAllRecords: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.getRecords(args).then(({ records }) => records);
    },
    recordsFeed: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.getRecords(args);
    },
    getFoodItems: (root, { ids }, { dataSources }) => (
      dataSources.foodJournalAPI.getFoodItemsByIDs(ids)
    ),
    filterFoodItems: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.filterFoodItems(args);
    },
    login: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.login(args);
    },
    totals: (root, args, { dataSources }) => {
      return dataSources.foodJournalAPI.totals(args);
    },
    weeklyRecordsFeed: (_, args, { dataSources }) => {
      return dataSources.foodJournalAPI.weeklyRecordsFeed(args);
    }
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
    },
    deleteRecord: (root, { id }, { dataSources }) => {
      return dataSources.foodJournalAPI.deleteRecord(id);
    },
  }
};

module.exports = {
  resolvers: decorateObject(resolvers, authResolverDecorator)
};