import { ButtonBuilder, ButtonStyle, ContainerBuilder } from "discord.js";
import { Command } from "../../lib/command";
import { card, COLORS, text } from "../../lib/components";
import { DOT, replyInfo } from "../../lib/response";
import { allStars } from "../../lib/db";
import { Pagination } from "../../lib/pagination";

const stars: Command = {
    name: "stars",
    description: "View the leaderboard of starred messages",
    aliases: ["star", "leaderboard"],
    messageRun: async (msg) => {
        const rows = (await allStars()).sort((a, b) => b.stars - a.stars);
        if (!rows.length) {
            replyInfo(msg, "No messages have been starred yet.");
            return;
        }

        const chunks: (typeof rows)[] = [[]];
        rows.forEach((row) => {
            if (chunks[chunks.length - 1].length >= 10) chunks.push([]);
            chunks[chunks.length - 1].push(row);
        });

        const pages: ContainerBuilder[] = chunks.map((chunk, page) => {
            const start = page * 10;
            return card(
                COLORS.gold,
                text(`## Starred messages`),
                text(
                    chunk
                        .map(
                            (row, i) =>
                                `**${start + i + 1}** ${DOT} [Jump to message](${messageUrl(
                                    row.guild,
                                    row.channel,
                                    row.message
                                )}) ${DOT} ${row.stars} ${
                                    row.stars === 1 ? "star" : "stars"
                                } ${DOT} <@${row.author}>`
                        )
                        .join("\n")
                ),
                text(`-# Page ${page + 1} of ${chunks.length}`)
            );
        });

        await Pagination(msg, pages, [
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
