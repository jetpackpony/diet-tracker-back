const { DataSource } = require('apollo-datasource');

const idsToStrings = (item) => ({
  ...item,
  id: item._id.toString()
});

class FoodJournalAPI extends DataSource {
  constructor({ db }) {
    super();
    this.db = db;
  }

  /**
   * This is a function that gets called by ApolloServer when being setup.
   * This function gets called with the datasource config including things
   * like caches and context. We'll assign this.context to the request context
   * here, so we can know about the user making requests
   */
  initialize(config) {
    this.context = config.context;
  }

  async getRecords() {
    const res = await this.db.collection("records")
      .aggregate([{
        $lookup: {
          from: "foodItems",
          localField: "foodItemID",
          foreignField: "_id",
          as: "foodItem"
        }
      }])
      .toArray()
      .then(
        (recs) => recs.map(
          (rec) => ({
            ...idsToStrings(rec),
            foodItem: {
              ...idsToStrings(rec.foodItem[0])
            }
          })
        )
      );
    return res;
  }

  async getFoodItemsByIDs(ids) {
    return this.db.collection("foodItems")
      .find({ _id: { $in: ids } })
      .toArray()
      .then((items) => items.map(idsToStrings));
  }
}

module.exports = FoodJournalAPI;