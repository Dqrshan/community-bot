import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import { DOT, errorEmbed, infoEmbed, successEmbed } from "../../lib/response";
import { findSuggestion, resolveSuggestion } from "../../lib/db";
import { suggestionsCh } from "../../config";

const suggestion: Command = {
    name: "suggestion",
    description: "Approve or deny a pending suggestion (staff only)",
    staffOnly: true,
    aliases: ["suggestions"],
    usage: "approve <id> [reason] | deny <id> [reason]",
    examples: ["approve 1", "deny 2 out of scope"],
    messageRun: async (msg: Message, args?: string[]) => {
        const action = args?.[0]?.toLowerCase();
        const id = parseInt(args?.[1] ?? "");

        if (action !== "approve" && action !== "deny") {
            msg.reply({
                embeds: [
                    infoEmbed(
                        `Usage ${DOT} \`${msg.client.prefix}suggestion approve <id> [reason]\`\nUsage ${DOT} \`${msg.client.prefix}suggestion deny <id> [reason]\``
                    )
                ]
            });
            return;
        }
        if (isNaN(id)) {
            msg.reply({
                embeds: [errorEmbed("Please provide a valid suggestion ID.")]
            });
            return;
        }

        const row = await findSuggestion(msg.guildId!, id);
        if (!row) {
            msg.reply({
                embeds: [errorEmbed("I couldn't find that suggestion.")]
            });
            return;
        }
        if (row.status !== "pending") {
            msg.reply({
                embeds: [
                    infoEmbed(`Suggestion #${id} is already ${row.status}.`)
                ]
            });
            return;
        }

        const channel = msg.guild?.channels.cache.get(
            suggestionsCh
        ) as TextChannel | undefined;
        if (!channel || !row.message) {
            msg.reply({
                embeds: [errorEmbed("The suggestion message is missing.")]
            });
            return;
        }

        const posted = await channel.messages
            .fetch(row.message)
            .catch(() => null);
        if (!posted) {
            msg.reply({
                embeds: [errorEmbed("The suggestion message is missing.")]
            });
            return;
        }

        const reason = args!.slice(2).join(" ") || null;
        const accepted = action === "approve";

        const embed = EmbedBuilder.from(posted.embeds[0].data)
            .setColor(accepted ? "Green" : "Red")
            .setFooter({
                text: `Suggestion ${id} ${DOT} ${accepted ? "Implemented" : "Rejected"}`
            });
        if (reason) {
            embed.addFields({
                name: accepted ? "Resolution" : "Reason",
                value: reason,
                inline: false
            });
        }

        await posted.edit({
            embeds: [embed],
            components: []
        });
        await resolveSuggestion(
            msg.guildId!,
            id,
            accepted ? "accepted" : "denied",
            reason,
            msg.author.id
        );

        msg.reply({
            embeds: [
                successEmbed(
                    `Suggestion #${id} ${accepted ? "accepted" : "denied"}.`
                )
            ]
        });
    }
};

export default suggestion;
