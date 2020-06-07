import Library from "../api/Library";

const PATH = "/Users/citelao/Library/Application Support/The Hit List/The Hit List Library.thllibrary/library.sqlite3";

((async () => {
    const library = await Library.create(PATH);
    (await library.getTags()).forEach((tag) => console.dir(tag))
    // console.dir((await library.getTags()).l);
    library.close();
})()).catch((reason) => {
    throw reason;
})
