import { EmbedBuilder, Message } from "discord.js";
import { Command } from "../../lib/command";

const AFK: Command = {
    name: "afk",
    description: "Set an AFK status so people know you're away",
    examples: ["sleeping", "studying", " "],
    usage: "[reason]",
    messageRun: async (msg: Message, args?: string[]) => {
        const data = await msg.client.prisma.afk.findUnique({
            where: {
                guild_user: {
                    user: msg.author.id,
                    guild: msg.guildId!
                }
            }
        });

        if (data) {
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setDescription("⚠️ You are already AFK!")
                ]
            });
            return;
        }

        let reason = args!.length ? args!.join(" ") : "AFK";
        if (reason.length > 500) {
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            "❌ The reason cannot exceed `500` characters."
                        )
                ]
            });
            return;
        }
        reason = reason
            .replaceAll(/@everyone/g, "everyone")
            .replaceAll(/@here/g, "here")
            .replaceAll(/@&/g, "");

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({
                name: `${msg.author.username} is now AFK`,
                iconURL: msg.author.displayAvatarURL()
            })
            .setDescription(`> 💤 ${reason}`)
            .setFooter({
                text: "I'll clear this automatically when you return"
            })
            .setTimestamp();

        msg.reply({ embeds: [embed] });

        const name = msg.member?.displayName ?? msg.author.displayName;
        if (!name.startsWith("[AFK]"))
            msg.member!.setNickname(`[AFK] ${name}`).catch(() => {});

        await msg.client.prisma.afk.create({
            data: {
                user: msg.author.id,
                guild: msg.guildId!,
                reason,
                timestamp: Date.now()
            }
        });
    }
};

export default AFK;
