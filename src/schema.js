import { gql } from 'apollo-server';

export const typeDefs = gql`
  type Query {
    getAllRecords: [Record]!
    recordsFeed(
      cursor: String!
      limit: Int!
    ): RecordFeed!
    weeklyRecordsFeed(
      cursor: String!
      limit: Int!
    ): WeeklyRecordsFeed!
    getFoodItems(ids: [ID!]!): [FoodItem]!
    filterFoodItems(
      filter: String!
      limit: Int!
    ): [FoodItem]!
    login(userName: String!, password: String!): LoginResult
    totals(startInterval: DateTime!, endInterval: DateTime!): Totals!
    getRecord(id: ID!): Record
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

  type RecordFeed {
    cursor: String!
    records: [Record]!
  }

  type WeeklyRecordsFeed {
    cursor: String!
    weeks: [WeekRecords]!
  }

  type WeekRecords {
    weekStart: DateTime!
    weekEnd: DateTime!
    totals: Totals
    days: [DayRecords]!
  }

  type DayRecords {
    dayStart: DateTime!
    dayEnd: DateTime!
    totals: Totals
    records: [Record]!
  }

  type User {
    id: ID!
  }

  type LoginResult {
    user: User
    token: String
  }

  type Totals {
    calories: Float!
    protein: Float!
    fat: Float!
    carbs: Float!
  }
`;
