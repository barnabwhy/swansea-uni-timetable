export function getStartOfWeek(offset: number = 0) {
    let d = new Date(Date.now() + 24 * 3600 * 1000 * 7 * offset);
    const day = d.getDay();

    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    d.setDate(diff)

    return d;
}

export async function waitFor<T>(ms: number, res: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(res);
        }, ms);
    })
}

export function formatTime(dateStr: string) {
    let d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export class StreamedList<T> extends EventTarget  {
    public list: T[];
    private reader?: ReadableStreamDefaultReader;
    private str = "";
    private start = 0;

    constructor() {
        super();
        this.list = [];
    }

    public read(reader: ReadableStreamDefaultReader) {
        this.list = [];
        this.reader = reader;
        this.reader?.read().then(r => this.processData(r));
    }

    private processData({ done, value }: ReadableStreamReadResult<Uint8Array>) {
        if (done) {
            this.list = JSON.parse(this.str);
            return;
        }

        let str = this.str + new TextDecoder().decode(value);
        this.str = str;

        let depth = 0;
        for (let i = this.start; i < str.length; i++) {
            if (i == 0) {
                if (str[i] != '[')
                    throw 'Did not start with [';

                continue;
            }

            if (str[i] == '{') {
                if (depth == 0)
                    this.start = i;

                depth++;
                continue;
            }

            if (str[i] == '}') {
                if (depth > 0)
                    depth--;

                if (depth == 0) {
                    let objStr = str.slice(this.start, i+1);
                    this.list.push(JSON.parse(objStr));
                    this.dispatchEvent(new Event('update'));
                }

                continue;
            }

            if (str[i] == ',' && depth == 0) {
                continue;
            }

            if (str[i] == ']' && depth == 0) {
                this.dispatchEvent(new Event('done'));
                return;
            }
        }

        this.reader?.read().then(r => this.processData(r));
    }
}

function areBracketsBalanced(s: string): boolean {
    let i = 0;
    for (let ch of s) {
        if (ch === '{') {
            i++;
        } else {
            if (ch === '}') {
                if (i == 0)
                    return false;

                i--;
            }
        }
    }

    return i === 0;
}