const { gql } = require('apollo-server');

const typeDefs = gql`
  type Query {
    getAllRecords: [Record]!
    getFoodItems(ids: [ID!]!): [FoodItem]!
    filterFoodItems(
      filter: String!
      limit: Int!
    ): [FoodItem]!
  }

  type Mutation {
    addFoodItem(
      title: String!
      calories: Float!
      protein: Float!
      fat: Float!
      carbs: Float!
    ): FoodItem
    addRecord(
      foodItemID: ID!
      weight: Int!
      eatenAt: DateTime!
      createdAt: DateTime!
    ): Record
    addRecordWithFoodItem(
      title: String!
      calories: Float!
      protein: Float!
      fat: Float!
      carbs: Float!
      weight: Int!
      eatenAt: DateTime!
      createdAt: DateTime!
    ): Record
    updateRecord(
      id: ID!
      weight: Int
    ): Record
    deleteRecord(
      id: ID!
    ): ID
  }

  scalar DateTime

  type FoodItem {
    id: ID!
    title: String!
    calories: Float!
    protein: Float!
    fat: Float!
    carbs: Float!
  }

  type Record {
    id: ID!
    foodItem: FoodItem!
    weight: Int!
    eatenAt: DateTime!
    createdAt: DateTime!
  }
`;

module.exports = { typeDefs };