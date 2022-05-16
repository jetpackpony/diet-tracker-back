import { ApolloServer, gql } from 'apollo-server';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { GraphQLDateTime } from 'graphql-scalars';
import FoodJournalAPI from "./datasources/foodJournalAPI/index.js";
import { initDB } from "./db/index.js";
import { decodeToken } from "./authHelpers.js";
import moment from "moment";
moment.locale('en-week-starts-monday', {
  week: {
    dow: 1
  }
});

console.log("NODE_ENV: ", process.env.NODE_ENV);

(async () => {
  try {
    const db = await initDB();
    if (db == undefined) {
      throw new Error("No DB connection, exiting.");
    }

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
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
})();