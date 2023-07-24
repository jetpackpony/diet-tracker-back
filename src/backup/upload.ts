import fs from 'fs';
import drive from '@googleapis/drive';
import path from 'path';

export async function uploadBackup(filePath: string) {
  if (!process.env["SVC_ACCOUNT_FILE"]) {
    console.error("Couldn't load credentials from SVC_ACCOUNT_FILE variable");
    return null;
  }
  if (!process.env["BACKUP_FOLDER_ID"]) {
    console.error("No Google Drive folder id set in BACKUP_FOLDER_ID variable");
    return null;
  }

  const auth = new drive.auth.GoogleAuth({
    keyFile: process.env["SVC_ACCOUNT_FILE"],
    scopes: 'https://www.googleapis.com/auth/drive',
  });
  const client = drive.drive({
    version: 'v3',
    auth
  });

  const res = await client.files.create(
    {
      requestBody: {
        parents: [process.env["BACKUP_FOLDER_ID"]],
        name: path.basename(filePath),
      },
      media: {
        mimeType: "application/gzip",
        body: fs.createReadStream(filePath)
      },
    }
  );
  return res.data;
};
