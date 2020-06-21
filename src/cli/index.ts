import chalk from "chalk";
import stripAnsi from "strip-ansi";
import dateformat from "dateformat";

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

/**
 * Print text out in nice columns.
 *
 * @param content Content; can contain ANSI codes. These will be output but
 * excluded from measurement.
 * @param columns 
 * @param maxLength 
 */
function columns(
    content: Array<string | null>,
    columns: Array<{ canCollapse: boolean; shouldStretch: boolean; }>,
    { maxLength, padding }: {
        maxLength?: number;
        padding?: string;
    } = {}): string {

    if (!maxLength) {
        maxLength = process.stdout.columns;
    }

    if (!padding) {
        padding = " ";
    }

    // Get rid of any new lines in strings.
    content = content.map((v) => {
        if (!v) {
            return v;
        }

        const newLineIndex = v.indexOf("\n");
        const trimmedValue = (newLineIndex === -1)
            ? v
            : v.substr(0, newLineIndex) + "…";
        return trimmedValue;
    })

    // Naively try to print content:
    const naiveString = content.reduce<string>((gathered, value) => {
        if (!value) {
            return gathered;
        }

        if (gathered.length === 0) {
            return value;
        }

        return gathered + padding + value;
    }, "");
    const naiveLength = stripAnsi(naiveString).length;

    const paddingLength = stripAnsi(padding).length;
    const stringLengths = content.map((c) => (c)
        ? stripAnsi(c).length
        : 0);

    if (naiveLength < maxLength) {
        // Only handle 1 stretch column.
        const stretchLength = maxLength - naiveLength;
        return content.reduce<string>((gathered, value, index) => {
            const columnProperties = columns[index];

            if (!value) {
                return gathered;
            }
    
            if (gathered.length === 0) {
                return value;
            }

            return gathered +
                padding +
                value + 
                ((columnProperties.shouldStretch)
                    ? " ".repeat(stretchLength)
                    : "");
        }, "");
    } else if (naiveLength > maxLength) {
        // Only handle 1 collapse column.
        const collapseLength = naiveLength - maxLength;
        return content.reduce<string>((gathered, value, index) => {
            const columnProperties = columns[index];

            if (!value) {
                return gathered;
            }

            const valueLength = stripAnsi(value).length;
            const trimmedValue = (columnProperties.canCollapse)
                ? value.substr(0, valueLength - collapseLength - 1) + "…"
                : value;
    
            if (gathered.length === 0) {
                return trimmedValue;
            }

            return gathered +
                padding +
                trimmedValue;
        }, "");
    }

    // String must be the right size.
    return naiveString;
}

function printTask(task: ITask, indent = 0) {
    const state = task.status === "completed"
        ? chalk.green("[✓]")
        : (task.status === "canceled")
            ? chalk.red.strikethrough("[x]")
            : "[ ]";

    const title = (task.status === "canceled")
        ? chalk.strikethrough(task.title)
        : task.title;

    const id = chalk.gray(`(${task.id})`);

    const formattedDate = (task.due_date)
        ? dateformat(task.due_date, "yyyy/mm/dd")
        : "";
    const dueDate = (task.due_date === null)
        ? ""
        : ((task.status === "completed" || task.status === "canceled")
            ? chalk.grey(formattedDate)
            : (new Date() > task.due_date)
                ? chalk.green(formattedDate)
                : chalk.red(formattedDate));

    const TAB_WIDTH = 8;
    const COLUMN_LIMIT = process.stdout.columns;
    const maxLength = COLUMN_LIMIT - TAB_WIDTH * indent;
    console.log(
        "\t".repeat(indent) +
        columns([
            state,
            title,
            id,
            dueDate
        ], [
            { canCollapse: false, shouldStretch: false },
            { canCollapse: true, shouldStretch: false },
            { canCollapse: false, shouldStretch: true },
            { canCollapse: false, shouldStretch: false },
        ], {
            maxLength: maxLength
        }));

    if (task.notes) {
        // Print notes, trimmed to fit. Using `columns` means that the ellipsis
        // will not be the right style, but that's ok.
        const maxNoteLength = COLUMN_LIMIT - TAB_WIDTH * (indent + 1);
        console.log(`${"\t".repeat(indent + 1)}`
            + columns(
                [chalk.grey.italic(task.notes.text)],
                [{ canCollapse: true, shouldStretch: false}],
                { maxLength: maxNoteLength}));
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