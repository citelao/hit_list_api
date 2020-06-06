import sqlite3 from "sqlite3";

const PATH = "/Users/citelao/Library/Application Support/The Hit List/The Hit List Library.thllibrary/library.sqlite3";

async function all<T>(db: sqlite3.Database, query: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
        db.all(query, (err, rows) => {
            if (err) {
                reject(err);
            }

            resolve(rows);
        });
    })
}


const db = new sqlite3.Database(PATH, sqlite3.OPEN_READONLY);

interface ITask {
    title: string;
}

async function getTasks(): Promise<ITask[]> {
    return await all<ITask>(db, "SELECT ZTITLE AS title FROM ZTASK LIMIT 20");
}

((async () => {
    const tasks = await getTasks();
    tasks.forEach((t) => console.log(t.title));
    db.close();
})()).catch((reason) => {
    throw reason;
})
