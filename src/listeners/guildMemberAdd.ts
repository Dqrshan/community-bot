import {
    AttachmentBuilder,
    EmbedBuilder,
    GuildMember,
    TextChannel
} from "discord.js";
import { existsSync } from "fs";
import { guildId, voiceCh, welcomeCh } from "../config";
import { DOT } from "../lib/response";

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

        await channel
            .send({
                content: `Welcome ${member}`,
                embeds: [
                    new EmbedBuilder()
                        .setColor("Blurple")
                        .setTitle(
                            `${member.displayName} ${DOT} Member #${guild.memberCount}`
                        )
                        .setImage(banner ? "attachment://standard.gif" : null)
                        .setThumbnail(
                            member.displayAvatarURL({ size: 256 })
                        )
                        .setDescription(
                            [
                                `Read the rules in <#${CHANNELS.rules}> and keep them in mind`,
                                `Learn what this server is about in <#${CHANNELS.about}>`,
                                `Grab your roles at <id:customize>`,
                                `Say hello in <#${CHANNELS.general}> and introduce yourself`,
                                `Need help? Open a ticket in <#${CHANNELS.support}>`
                            ].join(`\n${DOT} `)
                        )
                        .addFields({
                            name: "Joined",
                            value: `<t:${Math.round(
                                member.joinedTimestamp! / 1000
                            )}:R>`,
                            inline: true
                        })
                        .setFooter({
                            text: guild.name,
                            iconURL: guild.iconURL() ?? undefined
                        })
                        .setTimestamp()
                ],
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
