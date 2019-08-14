const { ApolloServer, gql } = require('apollo-server');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const { GraphQLDateTime } = require("graphql-iso-date");

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    DateTime: GraphQLDateTime,
    ...resolvers,
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});