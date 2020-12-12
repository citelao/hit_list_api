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
    // Primary key
    Z_PK: number;

    // Name of task
    ZTITLE: string;

    // Completed or cancelled or active.
    ZSTATUS: string | null;

    ZDUEDATE: number | null;

    // ID of any related notes
    ZNOTES: number | null;
}

export async function getTasks(db: sqlite3.Database, list_id?: number, limit?: number): Promise<IRawTask[]> {
    const allTasksStatement = SqlString.format(
        "select * from ZTASK order by ZDISPLAYORDER limit ?",
        [limit]
    );
    const listStatement = SqlString.format(
        "select * from ZTASK where ZPARENTLIST = ? order by ZDISPLAYORDER",
        [list_id]
    )

    const statement = (list_id)
        ? listStatement
        : allTasksStatement;
    return await all<IRawTask>(db, statement);
}

export async function getCompletedTasks(db: sqlite3.Database, list_id?: number, limit?: number): Promise<IRawTask[]> {
    const allTasksStatement = SqlString.format(
        "select * from ZTASK where ZCOMPLETEDDATE is not null order by ZCOMPLETEDDATE desc limit ?",
        [limit]
    );
    const listStatement = SqlString.format(
        "select * from ZTASK where ZPARENTLIST = ? and ZCOMPLETEDDATE is not null order by ZCOMPLETEDDATE desc",
        [list_id]
    )

    const statement = (list_id)
        ? listStatement
        : allTasksStatement;
    return await all<IRawTask>(db, statement);
}

export async function getChildTasks(db: sqlite3.Database, task_id: number): Promise<IRawTask[]> {
    const statement = SqlString.format(
        "select * from ZTASK where ZPARENTTASK = ? order by ZDISPLAYORDER",
        [task_id]
    )
    return await all<IRawTask>(db, statement);
}

export interface IRawNote {
    Z_PK: number;
    ZSTRING: string;

    // There's also a Blob of ZWEBARCHIVEDATA which includes bold italics etc.
}

export async function getNote(db: sqlite3.Database, note_id: number): Promise<IRawNote> {
    // Only expect one note per task, at max.
    const statement = SqlString.format(
        "select * from ZTASKNOTES where Z_PK = ?",
        [note_id]
    )
    return await get<IRawNote>(db, statement);
}