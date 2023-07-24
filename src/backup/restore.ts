import { restoreBackup } from "./mongoTools.js";

if (!process.argv[2]) {
  console.log("The first argument should be a path to a database dump");
  process.exit();
}

if (await restoreBackup(process.argv[2])) {
  console.log("Restored database dump successfully");
} else {
  console.error("Failed to restore database dump");
}
