import { APIEmbed, Message, TextChannel } from "discord.js";
import Snipes from "../lib/snipes";
import { audit } from "../config";
import {
    actionRow,
    add,
    card,
    COLORS,
    divider,
    gallery,
    isImageUrl,
    linkButton,
    section,
    text,
    thumb,
    V2
} from "../lib/components";
import { DOT } from "../lib/response";

const embedToText = (embed: APIEmbed) => {
    const lines: string[] = [];
    if (embed.title) lines.push(`### ${embed.title}`);
    if (embed.description) lines.push(embed.description);
    embed.fields?.forEach((f) => lines.push(`**${f.name}**\n${f.value}`));
    if (embed.footer?.text) lines.push(`-# ${embed.footer.text}`);
    return lines.join("\n").slice(0, 600);
};

export default async function run(msg: Message) {
    if (
        msg.system ||
        !msg.author ||
        msg.author.bot ||
        msg.webhookId ||
        !msg.guild
    )
        return;
    let reference = null;
    const attachments: string[] = [];
    if (msg.attachments.size)
        msg.attachments.map((a) => attachments.push(a.proxyURL));
    if (msg.reference) reference = (await msg.fetchReference()).url;

    await Snipes.set(msg.client, msg.channelId, {
        message: msg.id,
        content: msg.content,
        author: msg.author.id,
        attachments,
        embeds: msg.embeds.length ? msg.embeds.map((e) => e.toJSON()) : [],
        timestamp: Date.now(),
        reference
    });

    const images = attachments.filter(isImageUrl);
    const files = attachments.filter((url) => !isImageUrl(url));

    const container = card(
        COLORS.danger,
        section(
            [
                `## Deleted in ${msg.channel.toString()}`,
                `-# ${msg.author.username} ${DOT} <t:${Math.floor(
                    Date.now() / 1000
                )}:R> ${DOT} ID ${msg.id}`
            ],
            thumb(
                msg.author.displayAvatarURL({ size: 128 }),
                msg.author.username
            )
        ),
        divider(),
        text(
            reference
                ? `-# Replying to [original message](${reference})\n${msg.content}`
                : msg.content || "*No content/uncached*"
        )
    );

    if (images.length)
        add(container, divider(), gallery(images.slice(0, 10), "Attachment"));

    if (files.length)
        add(
            container,
            text(
                `**Attachments**\n${files
                    .slice(0, 10)
                    .map((url, i) => `[${i + 1}](${url})`)
                    .join(` ${DOT} `)}`
            )
        );

    if (msg.embeds.length) {
        add(
            container,
            divider(),
            text(`**Embeds** (${msg.embeds.length})`),
            ...msg.embeds
                .slice(0, 2)
                .map((embed) => embedToText(embed.toJSON()))
                .filter(Boolean)
                .map((block) => text(block))
        );
    }

    add(container, actionRow(linkButton("Jump", msg.url)));

    await (msg.client.channels.cache.get(audit) as TextChannel)
        .send({
            components: [container],
            flags: V2,
            allowedMentions: { parse: [] }
        })
        .catch((e) => msg.client.console.error(e));
}
