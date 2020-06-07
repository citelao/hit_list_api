import sqlite3 from "sqlite3";
import SqlString from "sqlstring";

// private async getGroups(count = 20): Promise<IGroup[]> {
//     const statement = SqlString.format(
//         "select * from ZGROUP order by ZDISPLAYORDER limit ?",
//         [count]
//     )
//     return await all<any>(this.db, statement);
// }

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

async function get<T>(db: sqlite3.Database, query: string): Promise<T> {
    return new Promise((resolve, reject) => {
        db.get(query, (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    })
}

export interface IGroup {
    Z_PK: number;
    ZTITLE: string;
    ZTYPE: "folder" | "list" | "smart" | "tag";
}

export async function getRootGroup(db: sqlite3.Database): Promise<IGroup> {
    const statement = SqlString.format(
        "select * from ZGROUP where ZPARENTGROUP is NULL",
        []
    );
    return await get<any>(db, statement);
}

export async function getChildGroups(db: sqlite3.Database, groupId: number): Promise<IGroup[]> {
    const statement = SqlString.format(
        "select * from ZGROUP where ZPARENTGROUP is ? order by ZDISPLAYORDER",
        [groupId]
    );
    return await all<any>(db, statement);
}

export interface IRawTask {
    Z_PK: number;
    ZTITLE: string;
    ZSTATUS: string | null;
}

export async function getTasks(db: sqlite3.Database, list_id: number): Promise<IRawTask[]> {
    const statement = SqlString.format(
        "select * from ZTASK where ZPARENTLIST = ? order by ZDISPLAYORDER",
        [list_id]
    )
    return await all<IRawTask>(db, statement);
}

export async function getChildTasks(db: sqlite3.Database, task_id: number): Promise<IRawTask[]> {
    const statement = SqlString.format(
        "select * from ZTASK where ZPARENTTASK = ? order by ZDISPLAYORDER",
        [task_id]
    )
    return await all<IRawTask>(db, statement);
}