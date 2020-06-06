import sqlite3 from "sqlite3";
import SqlString from "sqlstring";

export interface ITask {
    title: string;
};

export interface ITag {
    // TODO;
}

// TODO cleanup

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

// async function getTasks(count = 20): Promise<ITask[]> {
//     const statement = SqlString.format(
//         "SELECT ZTITLE AS title FROM ZTASK LIMIT ?",
//         [count]
//     )
//     return await all<ITask>(db, statement);
// }

interface IGroup {
    Z_PK: number;
    ZTITLE: string;
}

function getTagGroup(baseGroups: IGroup[]): IGroup {
    const group = baseGroups.find((group) => group.ZTITLE === "Tags");
    if (!group) {
        throw new Error("No tag group!");
    }

    return group;
}

export default class Library {
    private readonly db: sqlite3.Database;

    private rootGroup!: IGroup;
    private tagGroup!: IGroup;

    public static async create(path: string) {
        const lib = new Library(path);
        await lib.initialize();
        return lib;
    }

    private constructor(path: string) {
        this.db = new sqlite3.Database(path, sqlite3.OPEN_READONLY);
    }

    private async initialize() {
        this.rootGroup = await this.getRootGroup();
        const baseGroups = await this.getChildGroups(this.rootGroup.Z_PK);
        this.tagGroup = getTagGroup(baseGroups);
    }

    public async getTags(): Promise<ITag[]> {
        return await this.getChildGroups(this.tagGroup.Z_PK);
    }

    public close(): void {
        this.db.close();
    }

    // Private helpers
    private async getGroups(count = 20): Promise<any[]> {
        const statement = SqlString.format(
            "select * from ZGROUP order by ZDISPLAYORDER limit ?",
            [count]
        )
        return await all<any>(this.db, statement);
    }

    private async getRootGroup(): Promise<IGroup> {
        const statement = SqlString.format(
            "select * from ZGROUP where ZPARENTGROUP is NULL",
            []
        );
        return await get<any>(this.db, statement);
    }

    private async getChildGroups(groupId: number): Promise<IGroup[]> {
        const statement = SqlString.format(
            "select * from ZGROUP where ZPARENTGROUP is ? order by ZDISPLAYORDER",
            [groupId]
        );
        return await all<any>(this.db, statement);
    }
}