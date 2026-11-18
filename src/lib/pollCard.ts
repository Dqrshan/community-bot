import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { PollRow } from "./db";
import {
    actionRow,
    card,
    COLORS,
    divider,
    text
} from "./components";
import { DOT } from "./response";

/**
 * Single source of truth for a poll's layout, shared by the creation
 * command and the vote button handler.
 */
export const pollCard = (
    poll: PollRow,
    counts: number[],
    voters: number
) => {
    const options: string[] = JSON.parse(poll.options);
    const total = counts.reduce((sum, count) => sum + count, 0);

    const rows = options.map((option, index) => {
        const count = counts[index] ?? 0;
        const percent = total
            ? Math.round((count / total) * 100)
            : 0;
        return `**${index + 1}.** ${option}\n-# ${count} ${
            count === 1 ? "vote" : "votes"
        } ${DOT} ${percent}%`;
    });

    return card(
        COLORS.info,
        text("## Poll"),
        text(poll.question),
        divider(),
        text(rows.join("\n\n")),
        divider(),
        text(
            `-# Started by <@${poll.author}> ${DOT} <t:${Math.round(
                poll.timestamp / 1000
            )}:R> ${DOT} ${voters} ${
                voters === 1 ? "voter" : "voters"
            }`
        ),
        actionRow(
            ...options.map((_, index) =>
                new ButtonBuilder()
                    .setLabel(`${index + 1}`)
                    .setCustomId(`poll_${poll.key}_${index}`)
                    .setStyle(ButtonStyle.Secondary)
            )
        )
    );
};
