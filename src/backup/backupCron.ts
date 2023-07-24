import fs from "fs";
import cron from "node-cron";
import { makeBackup } from "./mongoTools.js";
import { uploadBackup } from "./upload.js";
import path from "path";

const backupSchedule = process.env["BACKUP_CRON_SETUP"] || "0 */12 * * *";
console.log(`Running a cronjob with the following schedule: ${backupSchedule}`);

const backupsPath = path.normalize(process.env["BACKUP_DIRECTORY"] || "./backups");
try {
  if (!fs.existsSync(backupsPath)) {
    fs.mkdirSync(backupsPath);
  }
} catch (err) {
  console.error(`Failed to create backups directory: ${err}`);
  process.exit();
}

cron.schedule(backupSchedule, async () => {
  console.log(`\n[${(new Date()).toISOString()}] Starting database backup`);
  const fileName = `${process.env["MONGO_DB_NAME"]}-${(new Date()).toISOString()}.gz.archive`;
  const filePath = path.join(backupsPath, fileName);
  const res = await makeBackup(filePath);
  if (!res) {
    console.error("Backup failed");
    return false;
  }
  console.log("Starting upload...");
  const uploadRes = await uploadBackup(filePath);
  if (uploadRes) {
    console.log(`Successfully uploaded file ${uploadRes.name}`);
    fs.unlinkSync(filePath);
  } else {
    console.error("Upload failed");
    return false;
  }
  return true;
});