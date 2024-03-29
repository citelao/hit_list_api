import express from "express";
import Library, { IFolder, IList } from "../api/Library";
import dateformat from "dateformat";
import relativeDate from "tiny-relative-date";
import Log from "../util/Logger";
const app = express();
const port = 3000;

// TODO: dynamic path.
const PATH = "/Users/citelao/Library/Application Support/The Hit List/The Hit List Library.thllibrary/library.sqlite3";

// TODO copied from from cli.
function findList(lists: Array<IList | IFolder>, predicate: (list: IList | IFolder) => boolean): IList | IFolder | null {
  for(let i = 0; i < lists.length; i++) {
      const list = lists[i];
      if (predicate(list)) {
          return list;
      }

      if (list.type === "folder" && list.children) {
          const child = findList(list.children, predicate);
          if (child) {
              return child;
          }
      }
  }

  return null;
}

app.set("views", "static/views/");
app.set("view engine", "ejs");
app.use(express.static("public"));

// Add dateformat & tiny-relative-date to all ejs
app.use((req, res, next)=>{
  res.locals.dateformat = dateformat;
  res.locals.relativeDate = relativeDate;
  next();
});

app.get('/', async (req, res) => {
  const library = await Library.create(PATH);
  const lists = await library.getLists();
  res.render("index", { lists });
});

app.get('/list/:listId', async (req, res) => {
  const library = await Library.create(PATH);
  const lists = await library.getLists();
  const listId = parseInt(req.params.listId);
  const list = findList(lists, (l) => l.id === listId);
  if (!list) {
    throw new Error(`Could not find list ${listId}.`);
  }
  if (list.type === "folder") {
      throw new Error(`List ${listId} is a folder`);
  }
  const tasks = await library.getTasks(list);
  res.render("list", { lists, list, tasks });
});

app.get('/task/:taskId', async (req, res) => {
  const library = await Library.create(PATH);
  const taskId = parseInt(req.params.taskId);
  const task = await library.getTask(taskId);
  const lists = await library.getLists();
  Log.verbose(task, { dir: true });
  res.render("task", { lists, task });
});

app.listen(port, () => {
  console.log(`Started webapp at http://localhost:${port}`);
});