/** @format */

import { Command } from "../../lib/command";

const pin: Command = {
    name: "pin",
    description: "Pins a message",
    staffOnly: true,
    messageRun: async (msg, args) => {
        if (!msg.reference && !args?.length) {
            msg.reply({
                content:
                    "Please reply to a message OR provide a message ID to pin!"
            });
            return;
        }
        const m = msg.reference
            ? await msg.fetchReference()
            : await msg.channel.messages.fetch(args![0]);
        if (!m) {
            msg.reply({
                content:
                    "Please reply to a message OR provide a message ID to pin!"
            });
            return;
        }

        if ((await msg.channel.messages.fetchPinned()).size >= 50) {
            msg.reply({
                content: "This channel has reached the pin limit!"
            });
            return;
        }

        await m.pin(`Pinned by ${msg.author.username}`).catch(() => {});
    }
};

export default pin;
