const SHOW_VERBOSE = true;

export default class Log {
    public static verbose(message: any, { dir = false }: { dir?: boolean; } = {}) {
        if (SHOW_VERBOSE) {
            if (dir) {
                console.dir(message);
            } else {
                console.log(message);
            }
        }
    }
}