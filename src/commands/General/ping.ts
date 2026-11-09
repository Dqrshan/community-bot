import { EmbedBuilder, Message } from "discord.js";
import type { Command } from "../../lib/command";

const ping: Command = {
    name: "ping",
    description: "Check the bot's latency and connection health",
    aliases: ["pong", "latency"],
    messageRun: async (msg: Message) => {
        const sent = await msg.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Blurple")
                    .setDescription("🏓 Pinging...")
            ]
        });

        const roundtrip = sent.createdTimestamp - msg.createdTimestamp;
        const ws = msg.client.ws.ping;
        const uptime = Math.round(
            (Date.now() - process.uptime() * 1000) / 1000
        );

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({
                name: "Pong!",
                iconURL: msg.client.user?.displayAvatarURL()
            })
            .addFields(
                {
                    name: "📡 Roundtrip",
                    value: `\`${roundtrip}ms\``,
                    inline: true
                },
                {
                    name: "🔌 Websocket",
                    value: `\`${ws < 0 ? "measuring..." : `${Math.round(ws)}ms`}\``,
                    inline: true
                },
                {
                    name: "⏱️ Uptime",
                    value: `<t:${uptime}:R>`,
                    inline: true
                }
            )
            .setFooter({
                text: `Requested by ${msg.author.username}`,
                iconURL: msg.author.displayAvatarURL()
            })
            .setTimestamp();

        await sent.edit({ embeds: [embed] });
    }
};

export default ping;
