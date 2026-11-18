import { ChannelType, Message } from "discord.js";
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

const VERIFICATION = ["None", "Low", "Medium", "High", "Highest"];

const serverinfo: Command = {
    name: "serverinfo",
    description: "View details and statistics about this server",
    aliases: ["si", "guildinfo", "server"],
    messageRun: async (msg: Message) => {
        const guild = msg.guild!;
        const owner = await guild.fetchOwner().catch(() => null);
        const channels = guild.channels.cache;

        const counts = {
            text: channels.filter((c) =>
                [
                    ChannelType.GuildText,
                    ChannelType.GuildAnnouncement,
                    ChannelType.GuildForum
                ].includes(c.type)
            ).size,
            voice: channels.filter((c) =>
                [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(
                    c.type
                )
            ).size,
            categories: channels.filter(
                (c) => c.type === ChannelType.GuildCategory
            ).size
        };

        const features = guild.features.length
            ? guild.features
                  .slice(0, 6)
                  .map((f) => `\`${f.toLowerCase().replace(/_/g, " ")}\``)
                  .join(` ${DOT} `)
            : "None";

        const container = card(
            COLORS.info,
            guild.iconURL({ size: 256 })
                ? section(
                      [
                          `# ${guild.name}`,
                          `-# ${guild.id}`,
                          guild.description
                              ? guild.description.slice(0, 200)
                              : `-# Created <t:${Math.round(
                                    guild.createdTimestamp / 1000
                                )}:R>`
                      ],
                      thumb(guild.iconURL({ size: 256 })!, guild.name)
                  )
                : text(
                      `# ${guild.name}\n-# ${guild.id}\n-# Created <t:${Math.round(
                          guild.createdTimestamp / 1000
                      )}:R>`
                  ),
            divider(),
            text(
                `**Owner** ${DOT} ${
                    owner ? `<@${owner.id}>` : "Unknown"
                }\n` +
                    `**Created** ${DOT} <t:${Math.round(
                        guild.createdTimestamp / 1000
                    )}:D>`
            ),
            divider(),
            text(
                `**Members** ${DOT} ${guild.memberCount.toLocaleString()}\n` +
                    `**Channels** ${DOT} ${counts.text} text ${DOT} ${counts.voice} voice ${DOT} ${counts.categories} categories\n` +
                    `**Roles** ${DOT} ${guild.roles.cache.size}\n` +
                    `**Emojis** ${DOT} ${guild.emojis.cache.size}`
            ),
            divider(),
            text(
                `**Boosts** ${DOT} Tier ${guild.premiumTier} ${DOT} ${
                    guild.premiumSubscriptionCount ?? 0
                } boost${
                    (guild.premiumSubscriptionCount ?? 0) === 1 ? "" : "s"
                }\n` +
                    `**Verification** ${DOT} ${
                        VERIFICATION[guild.verificationLevel] ?? "Unknown"
                    }\n` +
                    `**Features** ${DOT} ${features}` +
                    (guild.vanityURLCode
                        ? `\n**Vanity** ${DOT} discord.gg/${guild.vanityURLCode}`
                        : "")
            ),
            divider(),
            text(
                `-# Requested by ${msg.author.username} ${DOT} <t:${Math.round(
                    Date.now() / 1000
                )}:R>`
            )
        );

        return msg.reply({
            components: [container],
            flags: V2,
            allowedMentions: { parse: [] }
        });
    }
};

export default serverinfo;
