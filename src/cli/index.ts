import sqlite3 from "sqlite3";
import SqlString from "sqlstring";

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

async function getTasks(count = 20): Promise<ITask[]> {
    const statement = SqlString.format(
        "SELECT ZTITLE AS title FROM ZTASK LIMIT ?",
        [count]
    )
    return await all<ITask>(db, statement);
}

async function getGroups(count = 20): Promise<any[]> {
    const statement = SqlString.format(
        "SELECT * FROM ZGROUP LIMIT ?",
        [count]
    )
    return await all<any>(db, statement);
}

((async () => {
    // const tasks = await getTasks();
    // tasks.forEach((t) => console.log(t.title));

    (await getGroups(40)).forEach((v) => console.dir(v));

    (await all<any>(db, "SELECT * from ZGROUP LIMIT 20")).forEach((t) => console.dir(t));
    db.close();
})()).catch((reason) => {
    throw reason;
})
