import sqlite3 from "sqlite3";
import SqlString from "sqlstring";
import Log from "../util/Logger";

export interface ITask {
    title: string;
};

export interface ITag {
    // TODO;
}

export interface IFolder {
    title: string;
    children: Array<IFolder | IList> | null;
}

export interface IList {
    title: string;
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
    ZTYPE: "folder" | "list" | "smart" | "tag";
}

function findGroupByTitle(groups: IGroup[], title: string): IGroup {
    const group = groups.find((group) => group.ZTITLE === title);
    if (!group) {
        throw new Error("No tag group!");
    }

    return group;
}

export default class Library {
    private readonly db: sqlite3.Database;

    private rootGroup!: IGroup;
    private tagGroup!: IGroup;
    private foldersGroup!: IGroup;

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

        // TODO: does this work with loc?
        this.tagGroup = findGroupByTitle(baseGroups, "Tags");
        this.foldersGroup = findGroupByTitle(baseGroups, "Folders");
    }

    public async getTags(): Promise<ITag[]> {
        return await this.getChildGroups(this.tagGroup.Z_PK);
    }

    public async getLists(): Promise<Array<IFolder | IList>> {
        const topFolders = await this.getChildGroups(this.foldersGroup.Z_PK);
        return await Promise.all(topFolders.map((group) => this.parseGroup(group)));
    }

    public close(): void {
        this.db.close();
    }

    // Private helpers
    private async getGroups(count = 20): Promise<IGroup[]> {
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

    private async parseGroup(group: IGroup): Promise<IFolder | IList> {
        Log.verbose(group, { dir: true });

        if (group.ZTYPE === "folder") {
            const childGroups = await this.getChildGroups(group.Z_PK);
            const parsedChildren = await Promise.all(childGroups.map((childGroup) => this.parseGroup(childGroup)));
            const folder: IFolder = {
                title: group.ZTITLE,
                children: parsedChildren
            };
            return folder;
        } else if (group.ZTYPE === "list") {
            return {
                title: group.ZTITLE
            };
        }

        throw new Error(`Unexpected list type ${group.ZTYPE} for ${group.ZTITLE} (${group.Z_PK})`);
    }

}