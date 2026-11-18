import { Command } from "../../lib/command";
import { Message, version } from "discord.js";
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

const command: Command = {
    name: "debug",
    description: "Show bot diagnostics and runtime statistics",
    ownerOnly: true,
    messageRun: async (msg: Message) => {
        const uptime = Math.round(
            (Date.now() - process.uptime() * 1000) / 1000
        );
        const mem = process.memoryUsage();

        const container = card(
            COLORS.info,
            section(
                [
                    "# Bot diagnostics",
                    "-# Runtime and connection statistics"
                ],
                thumb(
                    msg.client.user!.displayAvatarURL({ size: 128 }),
                    "Bot avatar"
                )
            ),
            divider(),
            text(
                `**Websocket** ${DOT} \`${Math.round(
                    msg.client.ws.ping
                )}ms\`\n` +
                    `**Uptime** ${DOT} <t:${uptime}:R>\n` +
                    `**Memory** ${DOT} \`${(mem.heapUsed / 1024 / 1024).toFixed(
                        1
                    )} / ${(mem.heapTotal / 1024 / 1024).toFixed(
                        1
                    )} MB\``
            ),
            divider(),
            text(
                `**Servers** ${DOT} \`${msg.client.guilds.cache.size}\`\n` +
                    `**Commands** ${DOT} \`${msg.client.commands.size}\`\n` +
                    `**Cached users** ${DOT} \`${msg.client.users.cache.size.toLocaleString()}\``
            ),
            divider(),
            text(
                `**discord.js** ${DOT} \`v${version}\`\n` +
                    `**Node.js** ${DOT} \`${process.version}\`\n` +
                    `**Platform** ${DOT} \`${process.platform} ${process.arch}\``
            ),
            divider(),
            text(
                `-# PID ${process.pid} ${DOT} <t:${Math.round(
                    Date.now() / 1000
                )}:R>`
            )
        );

        await msg.reply({ components: [container], flags: V2 });
    }
};

export default command;
