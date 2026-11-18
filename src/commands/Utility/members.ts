import { Message } from "discord.js";
import { Command } from "../../lib/command";
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

        const container = card(
            guild.iconURL() ? COLORS.info : COLORS.muted,
            section(
                [
                    `# ${guild.name}`,
                    "-# Live member statistics",
                    `-# Created <t:${Math.round(
                        guild.createdTimestamp / 1000
                    )}:R>`
                ],
                guild.iconURL({ size: 256 })
                    ? thumb(guild.iconURL({ size: 256 })!, guild.name)
                    : thumb(msg.client.user!.displayAvatarURL(), "Bot avatar")
            ),
            divider(),
            text(
                `**Total** ${DOT} ${guild.memberCount.toLocaleString()}\n` +
                    `**Humans** ${DOT} ${humans.toLocaleString()}\n` +
                    `**Bots** ${DOT} ${bots.toLocaleString()}\n` +
                    `**Online** ${DOT} ${online.toLocaleString()}`
            ),
            divider(),
            text(
                `**Boosts** ${DOT} Level ${guild.premiumTier} ${DOT} ${
                    guild.premiumSubscriptionCount ?? 0
                }`
            ),
            text(
                `-# Requested by ${msg.author.username} ${DOT} <t:${Math.round(
                    Date.now() / 1000
                )}:R>`
            )
        );

        return msg.reply({ components: [container], flags: V2 });
    }
};

export default members;
