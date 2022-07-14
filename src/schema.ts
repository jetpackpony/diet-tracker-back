import { makeSchema } from "nexus";
import * as types from './graphql/index.js';
import { join } from "path";
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const schema = makeSchema({
  nonNullDefaults: {
    input: true,
    output: true
  },
  types,
  outputs: {
    schema: join(__dirname, "./generated/schema.graphql"),
    typegen: join(__dirname, "./generated/nexus-typegen.ts")
  },
  contextType: {
    module: join(process.cwd(), "src/context.ts"),
    export: "Context"
  }
});