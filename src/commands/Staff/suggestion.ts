import { Message, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import { editV2, statusContainer, V2 } from "../../lib/components";
import {
    countVotes,
    findSuggestion,
    resolveSuggestion
} from "../../lib/db";
import { suggestionsCh } from "../../config";
import { suggestionCard } from "../../lib/suggestionCard";

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
                components: [
                    statusContainer(
                        "info",
                        `**Usage**\n\`${msg.client.prefix}suggestion approve <id> [reason]\`\n\`${msg.client.prefix}suggestion deny <id> [reason]\``
                    )
                ],
                flags: V2
            });
            return;
        }
        if (isNaN(id)) {
            msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "Please provide a valid suggestion ID."
                    )
                ],
                flags: V2
            });
            return;
        }

        const row = await findSuggestion(msg.guildId!, id);
        if (!row) {
            msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "I couldn't find that suggestion."
                    )
                ],
                flags: V2
            });
            return;
        }
        if (row.status !== "pending") {
            msg.reply({
                components: [
                    statusContainer(
                        "info",
                        `Suggestion #${id} is already ${row.status}.`
                    )
                ],
                flags: V2
            });
            return;
        }

        const channel = msg.guild?.channels.cache.get(
            suggestionsCh
        ) as TextChannel | undefined;
        if (!channel || !row.message) {
            msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "The suggestion message is missing."
                    )
                ],
                flags: V2
            });
            return;
        }

        const posted = await channel.messages
            .fetch(row.message)
            .catch(() => null);
        if (!posted) {
            msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "The suggestion message is missing."
                    )
                ],
                flags: V2
            });
            return;
        }

        const reason = args!.slice(2).join(" ") || null;
        const accepted = action === "approve";
        const counts = await countVotes(msg.guildId!, id);

        await editV2(
            posted,
            [
                suggestionCard(
                    {
                        ...row,
                        status: accepted ? "accepted" : "denied",
                        reason,
                        staff: msg.author.id
                    },
                    counts
                )
            ],
            { allowedMentions: { parse: [] } }
        );
        await resolveSuggestion(
            msg.guildId!,
            id,
            accepted ? "accepted" : "denied",
            reason,
            msg.author.id
        );

        msg.reply({
            components: [
                statusContainer(
                    "success",
                    `Suggestion #${id} ${accepted ? "accepted" : "denied"}.`
                )
            ],
            flags: V2
        });
    }
};

export default suggestion;
