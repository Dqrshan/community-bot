import { Message, TextChannel } from "discord.js";
import { deleteStar, findStar, writeStar } from "./db";
import { DOT } from "./response";
import { emoji } from "./emojis";
import { starboardCh } from "../config";
import {
    actionRow,
    add,
    card,
    COLORS,
    divider,
    editV2,
    gallery,
    isImageUrl,
    linkButton,
    section,
    text,
    thumb,
    V2
} from "./components";

export const STAR = "⭐";
export const THRESHOLD = 3;

const messageLink = (msg: Message) =>
    `https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`;

const boardCard = (msg: Message, count: number) => {
    const content = msg.content?.trim();

    const container = card(
        COLORS.gold,
        section(
            [
                `## ${emoji("star")} ${count}`,
                `-# <#${msg.channelId}> ${DOT} <@${msg.author.id}>`
            ],
            thumb(
                msg.author.displayAvatarURL({ size: 128 }),
                msg.author.username
            )
        ),
        divider(),
        text(content ? content.slice(0, 3000) : "*Original message*")
    );

    const images = msg.attachments
        .filter(
            (a) =>
                a.contentType?.startsWith("image/") ||
                isImageUrl(a.url)
        )
        .map((a) => a.url);

    if (images.length)
        add(container, gallery(images, "Starred attachment"));

    add(
        container,
        divider(),
        actionRow(linkButton("View message", messageLink(msg)))
    );

    return container;
};

const starRow = (msg: Message, count: number, board: string | null) => ({
    message: msg.id,
    guild: msg.guildId!,
    channel: msg.channelId,
    author: msg.author.id,
    content: msg.content?.slice(0, 1000) ?? "",
    stars: count,
    board
});

export const syncStar = async (msg: Message) => {
    if (!msg.guild) return;
    const reaction = msg.reactions.cache.get(STAR);
    const count = reaction?.count ?? 0;
    const existing = await findStar(msg.id);
    const channel = msg.guild.channels.cache.get(
        starboardCh
    ) as TextChannel | undefined;

    if (count >= THRESHOLD) {
        const container = boardCard(msg, count);
        if (existing?.board) {
            if (!channel) return;
            const boardMsg = await channel.messages
                .fetch(existing.board)
                .catch(() => null);
            if (!boardMsg) {
                const posted = await channel
                    .send({
                        components: [container],
                        flags: V2,
                        allowedMentions: { parse: [] }
                    })
                    .catch(() => null);
                if (posted) await writeStar(starRow(msg, count, posted.id));
                return;
            }
            await editV2(boardMsg, [container], {
                allowedMentions: { parse: [] }
            });
            await writeStar(starRow(msg, count, existing.board));
        } else {
            if (!channel) return;
            const posted = await channel
                .send({
                    components: [container],
                    flags: V2,
                    allowedMentions: { parse: [] }
                })
                .catch(() => null);
            if (!posted) return;
            await writeStar(starRow(msg, count, posted.id));
        }
    } else if (existing) {
        if (existing.board && channel) {
            await channel.messages.delete(existing.board).catch(() => {});
        }
        await deleteStar(msg.id);
    }
};

export const handleStar = async (reaction: {
    partial: boolean;
    fetch: () => Promise<any>;
    message: { partial: boolean; fetch: () => Promise<Message> };
}) => {
    const message = reaction.message.partial
        ? await reaction.message.fetch()
        : (reaction.message as Message);
    await syncStar(message);
};
