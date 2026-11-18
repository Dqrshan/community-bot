import { APIEmbed, Message, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
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
    statusContainer,
    text,
    thumb,
    V2
} from "../../lib/components";
import { DOT } from "../../lib/response";
import Snipes, { snipeObject } from "../../lib/snipes";

/** Turns a sniped embed into a TextDisplay-friendly block. */
const embedToText = (embed: APIEmbed, fit: (value: string) => string) => {
    const lines: string[] = [];
    if (embed.title) lines.push(`### ${embed.title}`);
    if (embed.description) lines.push(embed.description);
    embed.fields?.forEach((f) => lines.push(`**${f.name}**\n${f.value}`));
    if (embed.footer?.text) lines.push(`-# ${embed.footer.text}`);
    return fit(lines.join("\n")).trim();
};

const snipe: Command = {
    name: "snipe",
    aliases: ["s"],
    staffOnly: true,
    description: "Retrieve recently deleted messages in a channel",
    usage: "[index] [#channel]",
    examples: ["15", "<#1031108420880842752>", "20 <#1031108420880842752>"],
    messageRun: async (msg: Message, args?: string[]) => {
        let index = 1;
        if (args?.[0] && !isNaN(parseInt(args[0]))) {
            index = parseInt(args[0]);
        }
        const channel = (msg.mentions.channels.first() ??
            msg.channel) as TextChannel;

        const snipes: snipeObject[] = Snipes.get(channel.id)!;
        if (!snipes || !snipes.length) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        `I couldn't find any deleted messages in ${channel}.`
                    )
                ],
                flags: V2
            });
        }

        const sniped = snipes[index - 1];
        if (!sniped) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        `Only ${snipes.length} deleted message(s) are stored for that channel.`
                    )
                ],
                flags: V2
            });
        }

        const {
            message,
            content,
            author,
            attachments,
            embeds,
            timestamp,
            reference
        } = sniped;

        const user = await msg.client.users.fetch(author!);

        const target = channel.id === msg.channelId ? "" : ` in ${channel}`;

        let budget = 3000;
        const fit = (value: string) => {
            if (value.length <= budget) {
                budget -= value.length;
                return value;
            }
            const sliced = value.slice(0, Math.max(budget - 1, 0)) + "…";
            budget = 0;
            return sliced;
        };

        const container = card(
            COLORS.danger,
            section(
                [`## ${user.displayName}${target}`],
                thumb(
                    user.displayAvatarURL({ size: 128 }),
                    user.displayName
                )
            ),
            divider()
        );

        if (reference)
            container.addTextDisplayComponents(
                text(`-# Replying to [original message](${reference})`)
            );

        container.addTextDisplayComponents(
            text(
                fit(
                    content?.trim() ||
                        (embeds.length || attachments.length
                            ? "*No text content*"
                            : "*No content/uncached*")
                )
            )
        );

        // Attachments: everything visual goes into one gallery, the rest
        // becomes clickable links – all inside the same container.
        const embedImages = embeds
            .flatMap((embed) => [embed.image?.url, embed.thumbnail?.url])
            .filter((url): url is string => Boolean(url));
        const imageUrls = [...attachments.filter(isImageUrl), ...embedImages];
        const fileUrls = attachments.filter((url) => !isImageUrl(url));
        const galleryUrls = imageUrls.slice(0, 10);
        const overflowImages = imageUrls.slice(10);

        if (galleryUrls.length)
            add(
                container,
                divider(),
                gallery(galleryUrls, "Deleted attachment")
            );

        const linkUrls = [...overflowImages, ...fileUrls];
        if (linkUrls.length)
            add(
                container,
                text(
                    `**Attachments**\n${linkUrls
                        .slice(0, 10)
                        .map(
                            (url, i) =>
                                `[${i + 1}](${url}) ${
                                    overflowImages.includes(url)
                                        ? "image"
                                        : "file"
                                }`
                        )
                        .join(` ${DOT} `)}${
                        linkUrls.length > 10
                            ? `\n-# and ${linkUrls.length - 10} more`
                            : ""
                    }`
                )
            );

        // Deleted embeds are rendered inline instead of follow-up messages.
        if (embeds.length) {
            const rendered = embeds
                .slice(0, 5)
                .map((embed) => embedToText(embed, fit))
                .filter(Boolean);
            if (rendered.length)
                add(
                    container,
                    divider(),
                    text(`**Deleted embeds** (${embeds.length})`),
                    ...rendered.map((block) => text(block))
                );
        }

        add(
            container,
            divider(),
            text(
                `-# Deleted <t:${Math.round(timestamp / 1000)}:R> ${DOT} ${index}/${
                    snipes.length
                } ${DOT} ID ${message}`
            ),
            actionRow(
                linkButton(
                    "Origin",
                    `https://discord.com/channels/${msg.guildId}/${channel.id}/${message}`
                )
            )
        );

        return msg
            .reply({
                components: [container],
                flags: V2,
                allowedMentions: { parse: [] }
            })
            .catch(() => {});
    }
};

export default snipe;
