import { Command } from "../../lib/command";
import { replyError, replySuccess } from "../../lib/response";

const usage = "Please reply to a message OR provide a message ID to pin.";

const pin: Command = {
    name: "pin",
    description: "Pin a message by reply or message ID",
    staffOnly: true,
    usage: "[messageID] | [reply to message]",
    examples: ["1234567890", " "],
    messageRun: async (msg, args) => {
        if (!msg.reference && !args?.length) {
            replyError(msg, usage);
            return;
        }

        const m = msg.reference
            ? await msg.fetchReference().catch(() => null)
            : await msg.channel.messages.fetch(args![0]).catch(() => null);
        if (!m) {
            replyError(msg, usage);
            return;
        }

        if ((await msg.channel.messages.fetchPinned()).size >= 50) {
            replyError(msg, "This channel has reached the pin limit of 50.");
            return;
        }

        await m.pin(`Pinned by @${msg.author.username}`).catch(() => {});
        replySuccess(
            msg,
            `[Message](${m.url}) pinned by ${msg.author}.`
        );
    }
};

export default pin;
