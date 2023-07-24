import fs from "fs";
import { spawnSync } from "child_process";
import { DBURL } from "../db/index.js";

export async function makeBackup(fileName: string) {
  console.log(`Creating a dump at: ${fileName}`);
  const res = spawnSync(
    `mongodump`,
    [
      `--uri=${DBURL}`,
      "--gzip",
      `--archive=${fileName}`
    ]
  );

  if (res.status === 0) {
    console.log(res.output.toString());
    return true;
  } else {
    console.error(`Error: ${res.error?.message}`);
    return null;
  }
};

export async function restoreBackup(fileName: string) {
  if (!fs.existsSync(fileName)) {
    console.error(`File doesn't exist: ${fileName}`);
    return null;
  }
  console.log(`Restoring a database dump from: ${fileName}`);

  const res = spawnSync(
    `mongorestore`,
    [
      `--uri=${DBURL}`,
      "--drop",
      "--gzip",
      `--archive=${fileName}`
    ]
  );

  if (res.status === 0) {
    console.log(res.output.toString());
    return true;
  } else {
    console.error(`Error: ${res.error?.message}`);
    return null;
  }
};