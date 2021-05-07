import express from "express";
import Library from "../api/Library";
const app = express();
const port = 3000;

app.set("views", "static/views/");
app.set("view engine", "ejs");

// TODO: dynamic path.
const PATH = "/Users/citelao/Library/Application Support/The Hit List/The Hit List Library.thllibrary/library.sqlite3";

app.get('/', async (req, res) => {
  const library = await Library.create(PATH);
  const lists = await library.getLists();
  res.render("index", { lists });
});

app.listen(port, () => {
  console.log(`Started webapp at http://localhost:${port}`);
});