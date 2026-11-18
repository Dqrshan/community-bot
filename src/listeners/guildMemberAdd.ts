import { AttachmentBuilder, GuildMember, TextChannel } from "discord.js";
import { existsSync } from "fs";
import { guildId, voiceCh, welcomeCh } from "../config";
import { DOT } from "../lib/response";
import {
    card,
    COLORS,
    divider,
    gallery,
    section,
    text,
    thumb,
    V2
} from "../lib/components";

const CHANNELS = {
    rules: "1083272137021866045",
    about: "1075735310736035900",
    support: "1031159883673911336",
    general: "1031108420880842752"
};

const BANNER = "assets/standard.gif";

export default async function run(member: GuildMember) {
    const guild = member.client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(welcomeCh) as
        | TextChannel
        | undefined;
    if (channel) {
        const banner = existsSync(BANNER) ? BANNER : null;
        const avatar = member.displayAvatarURL({ size: 512 });

        const container = card(
            COLORS.info,
            gallery(
                [banner ? "attachment://standard.gif" : avatar],
                banner ? "Welcome banner" : member.displayName
            ),
            section(
                [
                    `## Welcome, ${member.displayName}!`,
                    `-# ${member.user.username} ${DOT} Member #${guild.memberCount}`
                ],
                thumb(member.displayAvatarURL({ size: 256 }), member.displayName)
            ),
            divider(),
            text(
                [
                    `Read the rules in <#${CHANNELS.rules}> and keep them in mind`,
                    `Learn what this server is about in <#${CHANNELS.about}>`,
                    "Grab your roles at <id:customize>",
                    `Say hello in <#${CHANNELS.general}> and introduce yourself`,
                    `Need help? Open a ticket in <#${CHANNELS.support}>`
                ]
                    .map((line) => `${DOT} ${line}`)
                    .join("\n")
            ),
            divider(),
            text(
                `-# Joined <t:${Math.round(
                    member.joinedTimestamp! / 1000
                )}:R> ${DOT} ${guild.name}`
            )
        );

        await channel
            .send({
                components: [container],
                flags: V2,
                files: banner
                    ? [
                          new AttachmentBuilder(banner, {
                              name: "standard.gif"
                          })
                      ]
                    : []
            })
            .catch(() => {});
    }

    const countChannel = guild?.channels.cache.get(voiceCh);
    if (countChannel) {
        await countChannel
            .edit({ name: `Members ${DOT} ${guild.memberCount.toLocaleString()}` })
            .catch(() => {});
    }
}
