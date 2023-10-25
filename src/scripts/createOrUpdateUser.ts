import { Command } from "@commander-js/extra-typings";
import { initDB } from "../db/index.js";
import { createOrUpdateUser } from "../db/models/index.js";

const program = new Command()
  .requiredOption('-u, --userName <string>')
  .requiredOption('-p, --password <password>');

program.parse();

const { userName, password } = program.opts();

const db = await initDB();
if (db) {
  try {
    const user = await createOrUpdateUser(db, { userName, password });
    console.log(`User created with id: "${user._id}"`);
  } catch (err) {
    const msg = (err instanceof Error) ? err.message : "";
    console.error("Error creating or updating user: \n", msg);
  }
} else {
  console.error("Couldn't establish DB connection");
}