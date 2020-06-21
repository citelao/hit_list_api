import sqlite3 from "sqlite3";
import Log from "../util/Logger";
import { IGroup, getRootGroup, getChildGroups, getTasks, IRawTask, getChildTasks, getNote, IRawNote } from "./database";
import { raw } from "sqlstring";

export type Status = "completed" | "canceled" | null;
export interface ITask {
    id: number;
    title: string;
    children: Array<ITask>;
    status: Status;
    due_date: Date | null;
    notes: INote | null;
};

export interface INote {
    id: number;
    text: string;
}

export interface ITag {
    id: number;
    type: "tag";
    title: string;
}

export interface ITagFolder {
    id: number;
    type: "folder";
    title: string;
    children: Array<ITag | ITagFolder> | null;
}

export interface IFolder {
    id: number;
    type: "folder";
    title: string;
    children: Array<IFolder | IList> | null;
}

export interface IList {
    id: number;
    type: "list";
    title: string;
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
        this.rootGroup = await getRootGroup(this.db);
        const baseGroups = await getChildGroups(this.db, this.rootGroup.Z_PK);

        // TODO: does this work with loc?
        this.tagGroup = findGroupByTitle(baseGroups, "Tags");
        this.foldersGroup = findGroupByTitle(baseGroups, "Folders");
    }

    public async getTags(): Promise<Array<ITag | ITagFolder>> {
        const tagGroups = await getChildGroups(this.db, this.tagGroup.Z_PK);
        return await Promise.all(tagGroups.map((group) => this.parseTagGroup(group)));
    }

    public async getLists(): Promise<Array<IFolder | IList>> {
        const topFolders = await getChildGroups(this.db, this.foldersGroup.Z_PK);
        return await Promise.all(topFolders.map((group) => this.parseGroup(group)));
    }

    public async getTasks(list: IList): Promise<Array<ITask>> {
        const tasks = await getTasks(this.db, list.id);
        Log.verbose(tasks, { dir: true });
        // throw new Error("unimpl");
        return await Promise.all(tasks.map((task) => this.parseTask(task)));
    }

    public close(): void {
        this.db.close();
    }

    // Private helpers

    private async parseGroup(group: IGroup): Promise<IFolder | IList> {
        Log.verbose(group, { dir: true });

        if (group.ZTYPE === "folder") {
            const childGroups = await getChildGroups(this.db, group.Z_PK);
            const parsedChildren = await Promise.all(childGroups.map((childGroup) => this.parseGroup(childGroup)));
            const folder: IFolder = {
                id: group.Z_PK,
                type: "folder",
                title: group.ZTITLE,
                children: parsedChildren
            };
            return folder;
        } else if (group.ZTYPE === "list") {
            return {
                id: group.Z_PK,
                type: "list",
                title: group.ZTITLE
            };
        }

        throw new Error(`Unexpected list type ${group.ZTYPE} for ${group.ZTITLE} (${group.Z_PK})`);
    }

    private async parseTagGroup(group: IGroup): Promise<ITag | ITagFolder> {
        if (group.ZTYPE === "folder") {
            const childGroups = await getChildGroups(this.db, group.Z_PK);
            const parsedChildren = await Promise.all(childGroups.map((childGroup) => this.parseTagGroup(childGroup)));
            const folder: ITagFolder = {
                id: group.Z_PK,
                type: "folder",
                title: group.ZTITLE,
                children: parsedChildren
            };
            return folder;
        } else if (group.ZTYPE === "tag") {
            return {
                id: group.Z_PK,
                type: "tag",
                title: group.ZTITLE
            };
        }

        throw new Error(`Unexpected list type ${group.ZTYPE} for ${group.ZTITLE} (${group.Z_PK})`);
    }

    private static parseStatus(status: string | null): Status {
        switch(status) {
            case "C":
                return "completed";
            case "X":
                return "canceled";
            case null:
                return null;
        }

        throw new Error(`Unexpected status "${status}"`);
    } 

    private static parseTimestamp(timestamp: number): Date {
        // All timestamp dates in the Hit List seem to be offset by a fixed
        // value.
        const DATE_OFFSET = 977577918;
        const unixTimestamp = timestamp + DATE_OFFSET
        return new Date(unixTimestamp * 1000);
    }

    private async parseTask(rawTask: IRawTask): Promise<ITask> {
        const childTasks = await getChildTasks(this.db, rawTask.Z_PK);
        const rawNote = (rawTask.ZNOTES)
            ? await getNote(this.db, rawTask.ZNOTES)
            : null;
        return {
            id: rawTask.Z_PK,
            title: rawTask.ZTITLE,
            children: await Promise.all(childTasks.map((child) => this.parseTask(child))),
            status: Library.parseStatus(rawTask.ZSTATUS),
            due_date: (rawTask.ZDUEDATE)
                ? Library.parseTimestamp(rawTask.ZDUEDATE)
                : null,
            notes: (rawNote)
                ? await this.parseNote(rawNote)
                : null
        }
    }

    private async parseNote(rawNote: IRawNote): Promise<INote> {
        return {
            id: rawNote.Z_PK,
            text: rawNote.ZSTRING
        }
    }
}