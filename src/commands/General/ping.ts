import { Message } from "discord.js";
import type { Command } from "../../lib/command";
import {
    card,
    COLORS,
    divider,
    section,
    text,
    thumb,
    V2
} from "../../lib/components";
import { DOT } from "../../lib/response";
import { emoji } from "../../lib/emojis";

const ping: Command = {
    name: "ping",
    description: "Check the bot's latency and connection health",
    aliases: ["pong", "latency"],
    messageRun: async (msg: Message) => {
        const sent = await msg.reply({
            components: [
                card(COLORS.info, text("-# Measuring latency..."))
            ],
            flags: V2
        });

        const roundtrip = sent.createdTimestamp - msg.createdTimestamp;
        const ws = msg.client.ws.ping;
        const uptime = Math.round(
            (Date.now() - process.uptime() * 1000) / 1000
        );

        const container = card(
            COLORS.info,
            section(
                [
                    `## ${emoji("clock")} Pong`,
                    "-# Live connection health of the bot"
                ],
                thumb(
                    msg.client.user!.displayAvatarURL({ size: 128 }),
                    "Bot avatar"
                )
            ),
            divider(),
            text(
                `**Roundtrip** ${DOT} \`${roundtrip}ms\`\n` +
                    `**Websocket** ${DOT} \`${
                        ws < 0 ? "measuring" : `${Math.round(ws)}ms`
                    }\`\n` +
                    `**Uptime** ${DOT} <t:${uptime}:R>`
            ),
            divider(),
            text(
                `-# Requested by ${msg.author.username} ${DOT} <t:${Math.round(
                    Date.now() / 1000
                )}:R>`
            )
        );

        await sent.edit({ components: [container] });
    }
};

export default ping;
