import fs from 'fs';
import drive from '@googleapis/drive';

async function run(fileName) {
  const auth = new drive.auth.GoogleAuth({
    keyFile: process.env.SVC_ACCOUNT_FILE,
    scopes: 'https://www.googleapis.com/auth/drive',
  });
  const client = drive.drive({
    version: 'v3',
    auth
  });

  const res = await client.files.create(
    {
      requestBody: {
        parents: [process.env.BACKUP_FOLDER_ID],
        name: fileName,
      },
      media: {
        mimeType: "application/gzip",
        body: fs.createReadStream(fileName),
      },
    }
  );
  console.log(res.data);
  return res.data;
}

const fileName = process.argv[2];
run(fileName).catch(console.error);
