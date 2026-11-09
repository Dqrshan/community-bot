import { Command } from "../../lib/command";
import { errorEmbed, successEmbed } from "../../lib/response";

const usage = "Please reply to a message OR provide a message ID to pin.";

const pin: Command = {
    name: "pin",
    description: "Pin a message by reply or message ID",
    staffOnly: true,
    usage: "[messageID] | [reply to message]",
    examples: ["1234567890", " "],
    messageRun: async (msg, args) => {
        if (!msg.reference && !args?.length) {
            msg.reply({ embeds: [errorEmbed(usage)] });
            return;
        }

        const m = msg.reference
            ? await msg.fetchReference().catch(() => null)
            : await msg.channel.messages.fetch(args![0]).catch(() => null);
        if (!m) {
            msg.reply({ embeds: [errorEmbed(usage)] });
            return;
        }

        if ((await msg.channel.messages.fetchPinned()).size >= 50) {
            msg.reply({
                embeds: [
                    errorEmbed("This channel has reached the pin limit of 50.")
                ]
            });
            return;
        }

        await m.pin(`Pinned by @${msg.author.username}`).catch(() => {});
        msg.reply({
            embeds: [successEmbed(`Message pinned by ${msg.author}.`)]
        });
    }
};

export default pin;
