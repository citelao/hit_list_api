import Library, { IList } from "../api/Library";

const PATH = "/Users/citelao/Library/Application Support/The Hit List/The Hit List Library.thllibrary/library.sqlite3";

((async () => {
    const library = await Library.create(PATH);
    // (await library.getTags()).forEach((tag) => console.dir(tag));
    const lists = await library.getLists();
    (lists).forEach((folder) => console.dir(folder));
    (await library.getTags()).forEach((folder) => console.dir(folder));

    const firstList = lists.find((list) => list.type === "list");
    if (!firstList) { throw new Error("Should find a list."); }
    (await library.getTasks(firstList as IList)).forEach((task) => console.dir(task));
    library.close();
})()).catch((reason) => {
    throw reason;
})
