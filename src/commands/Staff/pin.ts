import { Command } from "../../lib/command";
import { EmbedBuilder } from "discord.js";

const pin: Command = {
    name: "pin",
    description: "Pin a message by reply or message ID",
    staffOnly: true,
    usage: "[messageID] | [reply to message]",
    examples: ["1234567890", " "],
    messageRun: async (msg, args) => {
        const usageEmbed = new EmbedBuilder()
            .setColor("Orange")
            .setDescription(
                "⚠️ Please reply to a message **OR** provide a message ID to pin!"
            );

        if (!msg.reference && !args?.length) {
            msg.reply({ embeds: [usageEmbed] });
            return;
        }

        const m = msg.reference
            ? await msg.fetchReference().catch(() => null)
            : await msg.channel.messages.fetch(args![0]).catch(() => null);
        if (!m) {
            msg.reply({ embeds: [usageEmbed] });
            return;
        }

        if ((await msg.channel.messages.fetchPinned()).size >= 50) {
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            "❌ This channel has reached the pin limit (50)!"
                        )
                ]
            });
            return;
        }

        await m.pin(`Pinned by @${msg.author.username}`).catch(() => {});
        msg.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor("Green")
                    .setDescription(
                        `📌 [Pinned](${m.url}) — <t:${Math.round(
                            Date.now() / 1000
                        )}:R>`
                    )
            ]
        });
    }
};

export default pin;
