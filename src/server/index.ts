import express from "express";
import path from "path";
const app = express()
const port = 3000

app.set("views", path.join(__dirname, "/views/"));
app.set("view engine", "ejs");

app.get('/', (req, res) => {
  res.render("index", {});
})

app.listen(port, () => {
  console.log(`Started webapp at http://localhost:${port}`)
})