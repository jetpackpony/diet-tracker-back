const { gql } = require('apollo-server');

const typeDefs = gql`
  type Query {
    getAllRecords: [Record]!
    getFoodItems(ids: [ID!]!): [FoodItem]!
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
      foodItemId: ID!
      weight: Int!
      createdAt: DateTime!
    ): Record
    addRecordWithFoodItem(
      title: String!
      calories: Float!
      protein: Float!
      fat: Float!
      carbs: Float!
      weight: Int!
      createdAt: DateTime!
    ): Record
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
    createdAt: DateTime!
  }
`;

module.exports = { typeDefs };