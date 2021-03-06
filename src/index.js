const { ApolloServer, gql } = require('apollo-server');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const { GraphQLDateTime } = require("graphql-iso-date");
const FoodJournalAPI = require("./datasources/foodJournalAPI");
const { initDB } = require("./db");
const { decodeToken } = require("./authHelpers");
const moment = require("moment");
moment.locale('en-week-starts-monday', {
  week: {
    dow: 1
  }
});

console.log("NODE_ENV: ", process.env.NODE_ENV);

(async () => {
  const { db } = await initDB();

  const server = new ApolloServer({
    typeDefs,
    dataSources: () => ({
      foodJournalAPI: new FoodJournalAPI({ db })
    }),
    resolvers: {
      DateTime: GraphQLDateTime,
      ...resolvers,
    },
    context: ({ req }) => {
      const token = req.headers.authorization || "";
      const user = decodeToken(token);
      return { user };
    }
  });

  server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
  });
})();