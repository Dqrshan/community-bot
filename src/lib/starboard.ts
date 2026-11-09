import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    TextChannel
} from "discord.js";
import { deleteStar, findStar, writeStar } from "./db";
import { DOT } from "./response";
import { starboardCh } from "../config";

export const STAR = "⭐";
export const THRESHOLD = 3;

const messageLink = (msg: Message) =>
    `https://discord.com/channels/${msg.guildId}/${msg.channelId}/${msg.id}`;

const boardEmbed = (msg: Message, count: number) => {
    const content = msg.content?.trim();
    const embed = new EmbedBuilder()
        .setColor("Gold")
        .setAuthor({
            name: msg.author.username,
            iconURL: msg.author.displayAvatarURL()
        })
        .setDescription(content ? content.slice(0, 3800) : "Original message")
        .addFields({
            name: "Stars",
            value: String(count),
            inline: false
        })
        .setFooter({
            text: `#${
                (msg.channel as TextChannel | undefined)?.name ?? "unknown"
            } ${DOT} Starboard`,
            iconURL: msg.author.displayAvatarURL()
        })
        .setTimestamp(msg.createdTimestamp);

    const image = msg.attachments.find((a) =>
        a.contentType?.startsWith("image/")
    );
    if (image) embed.setImage(image.url);

    const link = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setLabel("View message")
            .setStyle(ButtonStyle.Link)
            .setURL(messageLink(msg))
    );

    return { embed, link };
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
        const { embed, link } = boardEmbed(msg, count);
        if (existing?.board) {
            if (!channel) return;
            const boardMsg = await channel.messages
                .fetch(existing.board)
                .catch(() => null);
            if (!boardMsg) {
                const posted = await channel
                    .send({ embeds: [embed], components: [link] })
                    .catch(() => null);
                if (posted) await writeStar(starRow(msg, count, posted.id));
                return;
            }
            await boardMsg.edit({ embeds: [embed], components: [link] });
            await writeStar(starRow(msg, count, existing.board));
        } else {
            if (!channel) return;
            const posted = await channel
                .send({ embeds: [embed], components: [link] })
                .catch(() => null);
            if (!posted) return;
            await writeStar(starRow(msg, count, posted.id));
        }
    } else if (existing) {
        if (existing.board && channel) {
            await channel.messages
                .delete(existing.board)
                .catch(() => {});
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
