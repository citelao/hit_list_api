import chalk from "chalk";

import Library, { IList, IFolder, ITask, ITagFolder, ITag } from "../api/Library";

const PATH = "/Users/citelao/Library/Application Support/The Hit List/The Hit List Library.thllibrary/library.sqlite3";

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

function showHelp() {
    console.log("Hit List!");
    console.log("");
    console.log("Args:");
    console.log("--folders: print folders");
    console.log("--tags: print tags");
    console.log("--tasks list_id: print all tasks of a list");
}

function printFolder(list: IFolder | IList, indent = 0) {
    console.log(`${"\t".repeat(indent)}${list.title} `
        + chalk.gray(`(${list.id})`));
    if (list.type === "folder") {
        if (list.children) {
            list.children.forEach((child) => printFolder(child, indent + 1));
        }
    }
}

function printTag(tag: ITag | ITagFolder, indent = 0) {
    console.log(`${"\t".repeat(indent)}${tag.title} `
        + chalk.gray(`(${tag.id})`));
    if (tag.type === "folder") {
        if (tag.children) {
            tag.children.forEach((child) => printTag(child, indent + 1));
        }
    }
}

function printTask(task: ITask, indent = 0) {
    const state = task.status === "completed"
        ? chalk.green("[✓]")
        : (task.status === "canceled")
            ? chalk.red.strikethrough("[x]")
            : "[ ]";
    console.log(`${"\t".repeat(indent)}${state} `
        + ((task.status === "canceled")
            ? chalk.strikethrough(task.title)
            : task.title)
        + chalk.gray(` (${task.id})`));

    if (task.notes) {
        const COLUMN_LIMIT = process.stdout.columns;
        const TAB_WIDTH = 8;
        const maxNoteLength = COLUMN_LIMIT - TAB_WIDTH * (indent + 1);

        const trimmedNote = (task.notes.text.length > maxNoteLength)
            ? task.notes.text.substr(0, maxNoteLength - 3) + "..."
            : task.notes.text;
        
        const newLineIndex = trimmedNote.indexOf("\n");
        const finalTrimmedNote = (newLineIndex === -1)
            ? trimmedNote
            : trimmedNote.substr(0, newLineIndex) + "...";

        console.log(`${"\t".repeat(indent + 1)}`
            + chalk.grey.italic(finalTrimmedNote))
    }

    if (task.children) {
        task.children.forEach((child) => printTask(child, indent + 1));
    }
}

// Quick command line app!
const isRunningThroughNode = process.argv[0].endsWith("node");
const args = (isRunningThroughNode)
    ? process.argv.slice(2)
    : process.argv.slice(1);

if(args.length === 0) {
    showHelp();
    process.exit(0);
}

((async () => {
    const library = await Library.create(PATH);

    if (args[0] === "--folders") {
        const lists = await library.getLists();
        lists.forEach((list) => printFolder(list));
    } else if (args[0] === "--tags") {
        const tags = await library.getTags();
        tags.forEach((tag) => printTag(tag));
    } else if (args[0] === "--tasks") {
        const id = parseInt(args[1], 10);
        const lists = await library.getLists();
        const list = findList(lists, (l) => l.id === id);
        if (!list) {
            throw new Error(`Could not find list ${id}.`);
        }
        if (list.type === "folder") {
            throw new Error(`List ${id} is a folder`);
        }
        console.log(chalk.bold(list.title));
        const tasks = await library.getTasks(list!);
        tasks.forEach((task) => printTask(task));
    } else {
        showHelp();
        process.exit(0);
    }

    // // (await library.getTags()).forEach((tag) => console.dir(tag));
    // const lists = await library.getLists();
    // (lists).forEach((folder) => console.dir(folder));
    // (await library.getTags()).forEach((folder) => console.dir(folder));

    // const firstList = lists.find((list) => list.type === "list");
    // if (!firstList) { throw new Error("Should find a list."); }
    // (await library.getTasks(firstList as IList)).forEach((task) => console.dir(task));
    library.close();
})()).catch((reason) => {
    throw reason;
});