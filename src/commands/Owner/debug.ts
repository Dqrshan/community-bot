import { Command } from "../../lib/command";
import { EmbedBuilder, Message, version } from "discord.js";

const command: Command = {
    name: "debug",
    description: "Show bot diagnostics & runtime statistics",
    ownerOnly: true,
    messageRun: async (msg: Message) => {
        const uptime = Math.round(
            (Date.now() - process.uptime() * 1000) / 1000
        );
        const mem = process.memoryUsage();

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("🩺 Bot Diagnostics")
            .addFields(
                {
                    name: "🏓 Websocket",
                    value: `\`${Math.round(msg.client.ws.ping)}ms\``,
                    inline: true
                },
                {
                    name: "⏱️ Uptime",
                    value: `<t:${uptime}:R>`,
                    inline: true
                },
                {
                    name: "🧠 Memory",
                    value: `\`${(mem.heapUsed / 1024 / 1024).toFixed(1)} / ${(
                        mem.heapTotal /
                        1024 /
                        1024
                    ).toFixed(1)} MB\``,
                    inline: true
                },
                {
                    name: "🏠 Servers",
                    value: `\`${msg.client.guilds.cache.size}\``,
                    inline: true
                },
                {
                    name: "💬 Commands",
                    value: `\`${msg.client.commands.size}\``,
                    inline: true
                },
                {
                    name: "👥 Cached Users",
                    value: `\`${msg.client.users.cache.size.toLocaleString()}\``,
                    inline: true
                },
                {
                    name: "🤖 discord.js",
                    value: `\`v${version}\``,
                    inline: true
                },
                {
                    name: "🟢 Node.js",
                    value: `\`${process.version}\``,
                    inline: true
                },
                {
                    name: "⚙️ Platform",
                    value: `\`${process.platform} ${process.arch}\``,
                    inline: true
                }
            )
            .setFooter({
                text: `PID ${process.pid}`,
                iconURL: msg.client.user?.displayAvatarURL()
            })
            .setTimestamp();

        await msg.reply({ embeds: [embed] });
    }
};

export default command;
