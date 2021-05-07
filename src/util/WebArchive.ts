import plist from "simple-plist";

interface IWebArchive {
    WebMainResource: {
        WebResourceData: Array<number>;
        WebResourceFrameName: string;
        WebResourceMIMEType: string;
        WebResourceTextEncodingName: string;
        WebResourceURL: string;
    }
}

function parseWebArchiveEncoding(encoding: string): BufferEncoding {
    if (encoding === "UTF-8") {
        return "utf-8";
    }

    throw new Error(`Unknown encoding '${encoding}'`);
}

export default class WebArchive {
    private readonly data: IWebArchive;
    private readonly buffer: Buffer;

    constructor(blob: Buffer) {
        this.data = plist.parse(blob) as IWebArchive;
        // console.log(JSON.stringify(this.data));

        this.buffer = Buffer.from(this.data.WebMainResource.WebResourceData);
    }

    public get html(): string {
        console.log(this.buffer.toString(parseWebArchiveEncoding(this.data.WebMainResource.WebResourceTextEncodingName)));
        return this.buffer.toString(parseWebArchiveEncoding(this.data.WebMainResource.WebResourceTextEncodingName));
    }
}