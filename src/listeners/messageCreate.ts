import {
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    TextChannel
} from "discord.js";
import { aiChannel, owners, prefix, staff } from "../config";
import { chunkify } from "../lib/utils";
import { Pagination } from "../lib/pagination";
import {
    deleteAfk,
    deleteMentions,
    findAfk,
    findMentions,
    setMentions
} from "../lib/db";
import { errorEmbed, infoEmbed } from "../lib/response";
import { chatAsSudeep } from "../lib/ai";
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
                infoEmbed(
                    `My prefix is \`${msg.client.prefix}\`\nUse \`${msg.client.prefix}help\` to view all commands`
                )
            ]
        });
        return;
    }

    // prefix commands
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
                    embeds: [
                        errorEmbed("This command can only be used by the owners.")
                    ]
                });
                return;
            }
            if (
                command.staffOnly &&
                !owners.includes(msg.author.id) &&
                !msg.member.roles.cache.some((r) => staff.includes(r.id))
            ) {
                msg.reply({
                    embeds: [
                        errorEmbed("This command can only be used by the staff.")
                    ]
                });
                return;
            }
            await command.messageRun(msg, args);
        } catch (error) {
            msg.reply({
                embeds: [
                    errorEmbed(
                        error && error instanceof Error
                            ? `\`${error.name}\`: \`${error.message}\``
                            : `Error: ${error}`
                    )
                ]
            });
            msg.client.console.error(error);
        }
    }

    // check for afk
    const data = await findAfk(msg.guildId!, msg.author.id);
    if (data) {
        if (msg.content.startsWith(`${prefix}afk`)) return;
        const mentionData = (await findMentions(
            msg.guildId!,
            msg.author.id
        ))?.mentions;
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
                        .setLabel("Previous")
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId("_P"),
                    new ButtonBuilder()
                        .setLabel("Next")
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
            await deleteMentions(msg.guildId!, msg.author.id);
        } else {
            msg.reply({ embeds: [infoEmbed(content)] });
        }

        await deleteAfk(msg.guildId!, msg.author.id);
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

            const data = await findAfk(msg.guildId!, member.user.id);

            if (data) {
                msg.reply({
                    content: `**${member.displayName.replace(
                        "[AFK] ",
                        ""
                    )}** is AFK: ${data.reason} - <t:${Math.round(
                        Number(data.timestamp) / 1000
                    )}:R>`
                });
                const mentionData = await findMentions(
                    msg.guildId!,
                    member.user.id
                );
                const raw = mentionData ? JSON.parse(mentionData.mentions) : [];
                raw.unshift({
                    member: msg.author.id,
                    message: msg.url,
                    timestamp: Date.now()
                } as Mention);
                await setMentions(
                    msg.guildId!,
                    member.user.id,
                    JSON.stringify(raw)
                );

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

    // ai (Sudeep in the ai channel)
    if (msg.channelId === aiChannel) {
        if (!msg.content || msg.content.length < 3) return;
        await (msg.channel as TextChannel).sendTyping().catch(() => {});
        try {
            const reply = await chatAsSudeep(
                msg.guildId!,
                msg.author.id,
                msg.author.username,
                msg.content
            );
            await msg
                .reply({
                    content: reply,
                    allowedMentions: { repliedUser: true }
                })
                .catch(() => {});
        } catch (error) {
            msg.client.console.error(error);
            await msg
                .reply({
                    embeds: [
                        errorEmbed(
                            "Sudeep is taking a chai break. Try again in a bit."
                        )
                    ]
                })
                .catch(() => {});
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
