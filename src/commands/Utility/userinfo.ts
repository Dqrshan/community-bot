import {
    GuildMember,
    Message,
    PermissionFlagsBits,
    User
} from "discord.js";
import { Command } from "../../lib/command";
import {
    card,
    COLORS,
    divider,
    section,
    statusContainer,
    text,
    thumb,
    V2
} from "../../lib/components";
import { DOT } from "../../lib/response";

const KEY_PERMISSIONS: [bigint, string][] = [
    [PermissionFlagsBits.Administrator, "Administrator"],
    [PermissionFlagsBits.ManageGuild, "Manage Server"],
    [PermissionFlagsBits.ManageMessages, "Manage Messages"],
    [PermissionFlagsBits.ModerateMembers, "Moderate Members"],
    [PermissionFlagsBits.BanMembers, "Ban Members"],
    [PermissionFlagsBits.KickMembers, "Kick Members"]
];

const userinfo: Command = {
    name: "userinfo",
    description: "View details about a member of this server",
    aliases: ["whois", "ui"],
    usage: "[userID] | [@user]",
    examples: ["<@838620835282812969>", "838620835282812969", " "],
    messageRun: async (msg: Message, args?: string[]) => {
        let user: User;
        if (msg.mentions.users.size) {
            user = msg.mentions.users.first()!;
        } else if (args?.length) {
            user = await msg.client.users.fetch(args[0]).catch(() => null!);
            if (!user) {
                return msg.reply({
                    components: [
                        statusContainer("error", "I couldn't find that user.")
                    ],
                    flags: V2
                });
            }
        } else {
            user = msg.author;
        }

        const member: GuildMember | null = await msg
            .guild!.members.fetch({ user })
            .catch(() => null);

        const accent =
            member && member.displayHexColor !== "#000000"
                ? parseInt(member.displayHexColor.slice(1), 16)
                : COLORS.info;

        const roles = member
            ? member.roles.cache
                  .filter((role) => role.id !== msg.guildId)
                  .sort((a, b) => b.position - a.position)
            : null;

        const shownRoles = roles
            ? roles
                  .first(6)
                  .map((role) => `<@&${role.id}>`)
                  .join(` ${DOT} `)
            : "";

        const permissions = member
            ? KEY_PERMISSIONS.filter(([flag]) =>
                  member.permissions.has(flag)
              ).map(([, name]) => name)
            : [];

        const container = card(
            accent,
            section(
                [
                    `## ${user.displayName}`,
                    `-# <@${user.id}> ${DOT} ${user.id}`
                ],
                thumb(user.displayAvatarURL({ size: 256 }), user.username)
            ),
            divider(),
            text(
                `**Account created** ${DOT} <t:${Math.round(
                    user.createdTimestamp / 1000
                )}:D>\n` +
                    (member
                        ? `**Joined server** ${DOT} <t:${Math.round(
                              member.joinedTimestamp! / 1000
                          )}:D>\n`
                        : "") +
                    `**Type** ${DOT} ${user.bot ? "Bot" : "User"}`
            ),
            divider(),
            text(
                `**Top role** ${DOT} ${
                    member && roles?.size
                        ? `<@&${roles.first()!.id}>`
                        : "None"
                }\n` +
                    `**Roles** ${DOT} ${
                        roles?.size ? `${roles.size} total` : "None"
                    }${shownRoles ? `\n${shownRoles}` : ""}`
            ),
            divider(),
            text(
                `**Key permissions** ${DOT} ${
                    permissions.length
                        ? permissions.join(` ${DOT} `)
                        : "None"
                }`
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

export default userinfo;
