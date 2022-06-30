import { ApolloServer } from 'apollo-server';
import { initDB } from "./db/index.js";
import { decodeToken } from "./authHelpers.js";
import moment from "moment";
import { schema } from './schema.js';
import type { Context } from './context.js';
moment.locale('en-week-starts-monday', {
  week: {
    dow: 1
  }
});

console.log("NODE_ENV: ", process.env['NODE_ENV']);

(async () => {
  try {
    const db = await initDB();
    if (db == undefined) {
      throw new Error("No DB connection, exiting.");
    }

    const server = new ApolloServer({
      schema,
      context: ({ req }): Context => {
        const token = req.headers.authorization || "";
        const session = decodeToken(token);
        return { session, db };
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