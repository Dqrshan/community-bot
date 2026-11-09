import { EmbedBuilder, Message } from "discord.js";
import { Command } from "../../lib/command";
import { stripIndents } from "common-tags";

const members: Command = {
    name: "members",
    description: "View detailed member statistics for this server",
    aliases: ["mc", "membercount", "stats"],
    messageRun: async (msg: Message) => {
        const guild = msg.guild!;
        const fetched = await guild.members.fetch();
        const humans = fetched.filter((m) => !m.user.bot).size;
        const bots = fetched.filter((m) => m.user.bot).size;
        const online = guild.presences.cache.filter(
            (p) => p.status !== "offline"
        ).size;

        const embed = new EmbedBuilder()
            .setColor("#2F3136")
            .setTitle(`${guild.name} — Members`)
            .setThumbnail(guild.iconURL({ size: 256 }))
            .setDescription(
                stripIndents`
                👥 Total・**${guild.memberCount.toLocaleString()}**
                🧑 Humans・**${humans.toLocaleString()}**
                🤖 Bots・**${bots.toLocaleString()}**
                🟢 Online・**${online.toLocaleString()}**
                `
            )
            .addFields(
                {
                    name: "📅 Server Created",
                    value: `<t:${Math.round(
                        guild.createdTimestamp / 1000
                    )}:R>`,
                    inline: true
                },
                {
                    name: "🚀 Boosts",
                    value: `Level ${guild.premiumTier} • ${guild.premiumSubscriptionCount ?? 0}`,
                    inline: true
                }
            )
            .setFooter({
                text: `Requested by ${msg.author.username}`,
                iconURL: msg.author.displayAvatarURL()
            })
            .setTimestamp();

        return msg.reply({ embeds: [embed] });
    }
};

export default members;
