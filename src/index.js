const { ApolloServer, gql } = require('apollo-server');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const { GraphQLDateTime } = require("graphql-iso-date");
const FoodJournalAPI = require("./datasources/foodJournalAPI");
const { initDB } = require("./db");

const db = initDB();

const server = new ApolloServer({
  typeDefs,
  dataSources: () => ({
    foodJournalAPI: new FoodJournalAPI({ db })
  }),
  resolvers: {
    DateTime: GraphQLDateTime,
    ...resolvers,
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});