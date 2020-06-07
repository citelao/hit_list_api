import Library, { IList, IFolder } from "../api/Library";

const PATH = "/Users/citelao/Library/Application Support/The Hit List/The Hit List Library.thllibrary/library.sqlite3";

function showHelp() {
    console.log("Hit List!");
    console.log("");
    console.log("Args:");
    console.log("--folders: list folders");
}

function printFolder(list: IFolder | IList, indent = 0) {
    console.log(`${"\t".repeat(indent)} ${list.title} (${list.id})`);
    if (list.type === "folder") {
        if (list.children) {
            list.children.forEach((child) => printFolder(child, indent + 1));
        }
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