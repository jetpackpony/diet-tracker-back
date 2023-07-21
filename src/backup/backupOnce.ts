import { makeBackup } from "./mongoTools.js";

if (!process.argv[2]) {
  console.log("The first argument should be a target path to a database dump");
  process.exit();
}

if (await makeBackup(process.argv[2])) {
  console.log(`Backup successfully saved at: ${process.argv[2]}`);
} else {
  console.error("Backup failed");
}
