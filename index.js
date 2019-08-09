const express = require("express");
const app = express();


app.get('/*', (req, res) => {
  res.send(`Much updates. Hello, world! You are requesting '${req.originalUrl}'\n`);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));