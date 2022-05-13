const fs = require('fs');
const drive = require('@googleapis/drive');

async function runSample(fileName) {
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

// if invoked directly (not tests), authenticate and run the samples
if (module === require.main) {
  const fileName = process.argv[2];
  runSample(fileName).catch(console.error);
}
module.exports = runSample;