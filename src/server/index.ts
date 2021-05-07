import express from "express";
const app = express();
const port = 3000;

app.set("views", "static/views/");
app.set("view engine", "ejs");

app.get('/', (req, res) => {
  res.render("index", {});
});

app.listen(port, () => {
  console.log(`Started webapp at http://localhost:${port}`);
});