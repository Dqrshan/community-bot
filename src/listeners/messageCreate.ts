import {
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    TextChannel
} from "discord.js";
import { owners, prefix, staff } from "../config";
import { chunkify } from "../lib/utils";
import { Pagination } from "../lib/pagination";
import emojiRegex from "emoji-regex";
import ms from "ms";
import { Mention } from "../typings";

export default async function run(msg: Message) {
    if (msg.author.bot || msg.author.system || !msg.guild || !msg.member)
        return;

    // handle commands
    if (botMention(msg)) {
        msg.reply({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({
                        name: "👋 Hello!"
                    })
                    .setDescription(
                        `My prefix is \`${msg.client.prefix}\`\nUse \`${msg.client.prefix}help\` to view all commands`
                    )
                    .setColor("Blurple")
            ]
        });
        return;
    }
    if (msg.content.startsWith(msg.client.prefix)) {
        const args = msg.content.slice(msg.client.prefix.length).split(/ +/g);
        const c = args.shift()?.toLowerCase();

        if (!c) return;

        const command =
            msg.client.commands.get(c) ||
            msg.client.commands.find((x) => x.aliases && x.aliases.includes(c));
        if (!command) return;
        if (!command.messageRun) return;
        try {
            if (command.ownerOnly && !owners.includes(msg.author.id)) {
                msg.reply({
                    content: "This command can only be used by the owners"
                });
                return;
            }
            if (
                command.staffOnly &&
                !owners.includes(msg.author.id) &&
                !msg.member.roles.cache.some((r) => staff.includes(r.id))
            ) {
                msg.reply({
                    content: "This command can only be used by the staff"
                });
                return;
            }
            await command.messageRun(msg, args);
        } catch (error) {
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({
                            name: "❌ Error"
                        })
                        .setDescription(
                            error && error instanceof Error
                                ? `\`${error.name}\`: \`${error.message}\``
                                : `Error: ${error}`
                        )
                        .setColor("Red")
                ]
            });
            msg.client.console.error(error);
        }
    }

    // check for afk
    const data = await msg.client.prisma.afk.findUnique({
        where: {
            guild_user: {
                guild: msg.guildId!,
                user: msg.author.id
            }
        }
    });
    if (data) {
        if (msg.content.startsWith(`${prefix}afk`)) return;
        const mentionData = (
            await msg.client.prisma.mentions.findUnique({
                where: {
                    guild_user: {
                        user: msg.author.id,
                        guild: msg.guildId!
                    }
                }
            })
        )?.mentions;
        let mentions = null;
        if (mentionData) {
            mentions = JSON.parse(mentionData);
        }
        const content = `Welcome back! You were AFK for ${(await ms)(
            Date.now() - Number(data.timestamp),
            { long: true }
        )}`;
        if (mentions && mentions.length) {
            if (mentions.length > 10) {
                const pages: EmbedBuilder[] = [];
                const chunks = chunkify(
                    mentions
                        .sort(
                            (x: Mention, y: Mention) =>
                                Number(y.timestamp) - Number(x.timestamp)
                        )
                        .map((v: Mention, i: number) => ({
                            value: `\`${i + 1}\` <@!${v.member}>・[View](${
                                v.message
                            }) (<t:${Math.round(
                                Number(v.timestamp) / 1000
                            )}:R>)`
                        })),
                    10
                );

                chunks.forEach((chunk) => {
                    const em = new EmbedBuilder()
                        .setTitle(`Mentions (${mentions.length})`)
                        .setColor("Blurple")
                        .setDescription(chunk.map((e) => e.value).join("\n"));
                    pages.push(em);
                });

                const buttons = [
                    new ButtonBuilder()
                        .setLabel("⬅️")
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("_P"),
                    new ButtonBuilder()
                        .setLabel("➡️")
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("_N")
                ];

                await Pagination(msg, content, pages, buttons);
            } else {
                const em = new EmbedBuilder()
                    .setTitle(`Mentions (${mentions.length})`)
                    .setColor("Blurple")
                    .setDescription(
                        mentions
                            .sort(
                                (x: Mention, y: Mention) =>
                                    Number(y.timestamp) - Number(x.timestamp)
                            )
                            .map(
                                (v: Mention, i: number) =>
                                    `\`${i + 1}\` <@!${v.member}>・[View](${
                                        v.message
                                    }) (<t:${Math.round(
                                        parseInt(String(v.timestamp)) / 1000
                                    )}:R>)`
                            )
                            .join("\n")
                    );

                msg.reply({
                    content,
                    embeds: [em]
                });
            }
            await msg.client.prisma.mentions.deleteMany({
                where: { user: msg.author.id, guild: msg.guildId! }
            });
        } else {
            msg.reply({ content });
        }

        await msg.client.prisma.afk.delete({
            where: {
                guild_user: {
                    user: msg.author.id,
                    guild: msg.guildId!
                }
            }
        });
        if (msg.member.displayName.startsWith("[AFK]"))
            msg.member
                .setNickname(msg.member.displayName.replace("[AFK]", ""))
                .catch(() => {});
    }

    // append mentions
    if (msg.mentions && msg.mentions.members && msg.mentions.members.size) {
        let id: string = "";
        msg.mentions.members.forEach(async (member) => {
            if (id === member.user.id) return;

            const data = await msg.client.prisma.afk.findUnique({
                where: {
                    guild_user: {
                        guild: msg.guildId!,
                        user: member.user.id
                    }
                }
            });

            if (data) {
                msg.reply({
                    content: `**${member.displayName.replace(
                        "[AFK] ",
                        ""
                    )}** is AFK: ${data.reason} - <t:${Math.round(
                        parseInt(String(data.timestamp)) / 1000
                    )}:R>`
                });
                const mentionData = await msg.client.prisma.mentions.findUnique(
                    {
                        where: {
                            guild_user: {
                                guild: msg.guildId!,
                                user: member.user.id
                            }
                        }
                    }
                );
                const raw = mentionData ? JSON.parse(mentionData.mentions) : [];
                raw.unshift({
                    member: msg.author.id,
                    message: msg.url,
                    timestamp: Date.now()
                } as Mention);
                await msg.client.prisma.mentions.upsert({
                    where: {
                        guild_user: {
                            guild: msg.guildId!,
                            user: member.user.id
                        }
                    },
                    update: {
                        mentions: JSON.stringify(raw)
                    },
                    create: {
                        guild: msg.guildId!,
                        user: member.user.id,
                        mentions: JSON.stringify(raw)
                    }
                });

                id = member.user.id;
            }
        });
    }

    // qotw
    if ((msg.channel as TextChannel).name.includes("qotw")) {
        // default unicode emojis
        const regex = emojiRegex();
        // @ts-ignore
        for (const match of msg.content.matchAll(regex)) {
            const emoji = match[0];
            await msg.react(emoji).catch(() => {});
        }

        // custom discord emojis
        // @ts-ignore
        for (const match of msg.content.matchAll(/\d{15,}/g)) {
            const eId = match[0];
            await msg.react(eId).catch(() => {});
        }
    }
}

const botMention = (msg: Message) => {
    return [
        `<@!${msg.client.user.id}>`,
        `<@${msg.client.user.id}>`,
        `<@&${msg.guild!.roles.botRoleFor(msg.client.user)?.id}>`
    ].some((x) => msg.content === x);
};
