declare module "simple-plist" {
    export function stringify(obj: Object): string;

    export function parse(strOrBuffer: String | Buffer): unknown;
}