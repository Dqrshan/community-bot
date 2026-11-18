import { Message } from "discord.js";
import ms from "ms";
import { Command } from "../../lib/command";
import {
    card,
    COLORS,
    divider,
    statusContainer,
    text,
    V2
} from "../../lib/components";
import { insertReminder } from "../../lib/db";
import { DOT } from "../../lib/response";

const MIN_MS = 30 * 1000;
const MAX_MS = 30 * 24 * 60 * 60 * 1000;

const remind: Command = {
    name: "remind",
    description: "Get a DM reminder after a delay",
    aliases: ["reminder", "remindme"],
    usage: "<duration> <text>",
    examples: ["10m drink water", "2h check the ticket", "1d event starts"],
    messageRun: async (msg: Message, args?: string[]) => {
        const parsed = ms((args?.[0] ?? "") as ms.StringValue);
        const body = args?.slice(1).join(" ").trim();

        if (
            typeof parsed !== "number" ||
            parsed < MIN_MS ||
            parsed > MAX_MS ||
            !body
        ) {
            return msg.reply({
                components: [
                    statusContainer(
                        "info",
                        "**Usage**\n`+remind <duration> <text>`\n-# Duration between 30 seconds and 30 days, e.g. `10m`, `2h`, `1d`."
                    )
                ],
                flags: V2
            });
        }

        const remindAt = Date.now() + parsed;

        await insertReminder({
            guild: msg.guildId!,
            channel: msg.channelId,
            user: msg.author.id,
            text: body.slice(0, 500),
            remind_at: remindAt
        });

        const container = card(
            COLORS.info,
            text("## Reminder set"),
            text(body.slice(0, 500)),
            divider(),
            text(
                `-# I'll DM you <t:${Math.round(remindAt / 1000)}:R> ${DOT} <t:${Math.round(
                    remindAt / 1000
                )}:f>`
            )
        );

        return msg.reply({
            components: [container],
            flags: V2,
            allowedMentions: { parse: [] }
        });
    }
};

export default remind;
