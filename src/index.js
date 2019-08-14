const express = require("express");
const app = express();
const moment = require("moment");

app.get('/*', (req, res) => {
  res.send(`
  Much updates. Hello, world! You are requesting '${req.originalUrl}'\n
  Mongo Host: ${process.env["MONGO_HOST"]}
  Date here: ${moment().toString()}
  `);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));