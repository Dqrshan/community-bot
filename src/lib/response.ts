import { EmbedBuilder, type Message } from "discord.js";

export const DOT = "・";

const base = (
    color: Parameters<EmbedBuilder["setColor"]>[0],
    description: string
) => new EmbedBuilder().setColor(color).setDescription(description);

export const successEmbed = (description: string) =>
    base("Green", description);

export const errorEmbed = (description: string) =>
    base("Red", description);

export const infoEmbed = (description: string) =>
    base("Blurple", description);

export const replySuccess = (msg: Message, description: string) =>
    msg.reply({ embeds: [successEmbed(description)] });

export const replyError = (msg: Message, description: string) =>
    msg.reply({ embeds: [errorEmbed(description)] });

export const replyInfo = (msg: Message, description: string) =>
    msg.reply({ embeds: [infoEmbed(description)] });
