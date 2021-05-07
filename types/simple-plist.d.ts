declare module "simple-plist" {
    export function readFileSync(path: string): unknown;
    export function readFile(path: string, callback: (err: unknown, results: unknown) => void): unknown;

    export function stringify(obj: Object): string;

    export function parse(strOrBuffer: String | Buffer): unknown;
}