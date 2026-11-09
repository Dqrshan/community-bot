import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Command } from "../../lib/command";
import { DOT, infoEmbed } from "../../lib/response";
import { allStars } from "../../lib/db";
import { Pagination } from "../../lib/pagination";

const stars: Command = {
    name: "stars",
    description: "View the leaderboard of starred messages",
    aliases: ["star", "leaderboard"],
    messageRun: async (msg) => {
        const rows = (await allStars()).sort((a, b) => b.stars - a.stars);
        if (!rows.length) {
            msg.reply({
                embeds: [infoEmbed("No messages have been starred yet.")]
            });
            return;
        }

        const pages: EmbedBuilder[] = [];
        const chunks: typeof rows[] = [[]];
        rows.forEach((row) => {
            if (chunks[chunks.length - 1].length >= 10) chunks.push([]);
            chunks[chunks.length - 1].push(row);
        });

        chunks.forEach((chunk, page) => {
            const start = page * 10;
            const embed = new EmbedBuilder()
                .setColor("Gold")
                .setTitle("Starred messages")
                .setDescription(
                    chunk
                        .map(
                            (row, i) =>
                                `${start + i + 1} ${DOT} [Jump to message](${messageUrl(
                                    row.guild,
                                    row.channel,
                                    row.message
                                )}) ${DOT} ${row.stars} ${
                                    row.stars === 1 ? "star" : "stars"
                                } ${DOT} <@${row.author}>`
                        )
                        .join("\n")
                )
                .setFooter({
                    text: `Page ${page + 1} of ${chunks.length}`
                });
            pages.push(embed);
        });

        await Pagination(msg, "", pages, [
            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("P")
                .setLabel("Previous"),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("N")
                .setLabel("Next")
        ]);
    }
};

const messageUrl = (guild: string, channel: string, message: string) =>
    `https://discord.com/channels/${guild}/${channel}/${message}`;

export default stars;
