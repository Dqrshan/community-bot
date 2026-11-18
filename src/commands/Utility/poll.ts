import { Message } from "discord.js";
import { randomBytes } from "crypto";
import { Command } from "../../lib/command";
import { insertPoll, type PollRow } from "../../lib/db";
import { pollCard } from "../../lib/pollCard";
import { statusContainer, V2 } from "../../lib/components";

const poll: Command = {
    name: "poll",
    description: "Create a button poll in this channel",
    aliases: ["vote"],
    usage: "<question> | <option> | <option>",
    examples: [
        "Which event next? | Movie night | Game night | Study session"
    ],
    messageRun: async (msg: Message, args?: string[]) => {
        const parts = (args ?? [])
            .join(" ")
            .split("|")
            .map((part) => part.trim())
            .filter(Boolean);

        if (parts.length < 3 || parts.length > 6) {
            return msg.reply({
                components: [
                    statusContainer(
                        "info",
                        "**Usage**\n" +
                            "`+poll <question> | <option> | <option>`\n" +
                            "-# Between 2 and 5 options, separated by `|`."
                    )
                ],
                flags: V2
            });
        }

        const [question, ...options] = parts;
        const key = randomBytes(4).toString("hex");
        const timestamp = Date.now();

        const row: PollRow = {
            key,
            guild: msg.guildId!,
            channel: msg.channelId,
            message: null,
            author: msg.author.id,
            question: question.slice(0, 300),
            options: JSON.stringify(options.map((o) => o.slice(0, 80))),
            timestamp
        };

        const sent = await msg.reply({
            components: [pollCard(row, options.map(() => 0), 0)],
            flags: V2,
            allowedMentions: { parse: [] }
        });

        row.message = sent.id;
        await insertPoll(row);

        return sent;
    }
};

export default poll;
