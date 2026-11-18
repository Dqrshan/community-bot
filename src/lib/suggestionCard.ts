import { ButtonBuilder, ButtonStyle } from "discord.js";
import type { SuggestionRow } from "./db";
import {
    actionRow,
    add,
    card,
    COLORS,
    divider,
    text
} from "./components";
import { DOT } from "./response";

/**
 * Single source of truth for how a suggestion looks, used by the
 * submission command, the staff resolver and the vote button handler.
 */
export const suggestionCard = (
    suggestion: Pick<
        SuggestionRow,
        "guild" | "id" | "user" | "content" | "status" | "reason" | "staff" | "timestamp"
    >,
    counts: { up: number; down: number }
) => {
    const resolved = suggestion.status !== "pending";
    const accepted = suggestion.status === "accepted";
    const accent = resolved
        ? accepted
            ? COLORS.success
            : COLORS.danger
        : COLORS.info;

    const container = card(
        accent,
        text(`## Suggestion #${suggestion.id}`),
        text(suggestion.content)
    );

    if (resolved && suggestion.reason) {
        add(
            container,
            divider(),
            text(`**${accepted ? "Implemented" : "Rejected"}**\n${suggestion.reason}`)
        );
    }

    add(
        container,
        divider(),
        text(
            `**Votes**\nUpvotes ${DOT} ${counts.up}\nDownvotes ${DOT} ${counts.down}`
        ),
        text(
            `-# <@${suggestion.user}> ${DOT} <t:${Math.round(
                suggestion.timestamp / 1000
            )}:R>${
                resolved
                    ? ` ${DOT} ${accepted ? "Implemented" : "Rejected"}${
                          suggestion.staff
                              ? ` by <@${suggestion.staff}>`
                              : ""
                      }`
                    : ""
            }`
        )
    );

    if (!resolved)
        container.addActionRowComponents(
            actionRow(
                new ButtonBuilder()
                    .setEmoji("👍")
                    .setCustomId(`su_${suggestion.guild}_${suggestion.id}`)
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setEmoji("👎")
                    .setCustomId(`sd_${suggestion.guild}_${suggestion.id}`)
                    .setStyle(ButtonStyle.Danger)
            )
        );

    return container;
};
