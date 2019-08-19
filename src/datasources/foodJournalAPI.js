const { DataSource } = require('apollo-datasource');

const convertIDs = (rec) => ({
  ...rec,
  id: rec._id.toString(),
  foodItem: {
    ...rec.foodItem[0],
    id: rec.foodItem[0]._id.toString()
  }
})

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
      .then((recs) => recs.map(convertIDs));
      return res;
  }
}

module.exports = FoodJournalAPI;