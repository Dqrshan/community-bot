import { verifyString } from "discord.js";
import util from "util";

export const sleep = util.promisify(setTimeout);

export const chunkify = (arr: any[], len: number) => {
    const chunks = [];
    let i = 0;
    const n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, (i += len)));
    }
    return chunks;
};

export const splitContent = (content: string, limit: number) => {
    const char = [new RegExp(`.{1,${limit}}`, "g"), "\n"];
    const text = verifyString(content);
    if (text.length <= limit) return [text];
    let splitText = [text];

    while (char.length > 0 && splitText.some((elem) => elem.length > limit)) {
        const currentChar = char.shift();
        if (currentChar instanceof RegExp) {
            splitText = splitText
                .flatMap((chunk) => chunk.match(currentChar))
                .filter((value) => value !== null) as string[];
        } else {
            splitText = splitText.flatMap((chunk) => chunk.split(currentChar!));
        }
    }
    if (splitText.some((elem) => elem.length > limit)) {
        throw new RangeError("SPLIT_MAX_LEN");
    }
    const messages = [];
    let msg = "";
    for (const chunk of splitText) {
        if (msg && (msg + char + chunk).length > limit) {
            messages.push(msg);
            msg = "";
        }
        msg += (msg && msg !== "" ? char : "") + chunk;
    }
    return messages.concat(msg).filter((m) => m);
};
