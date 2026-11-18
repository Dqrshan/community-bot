import { Message, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import { statusContainer, V2 } from "../../lib/components";
import { DOT } from "../../lib/response";
import {
    insertSuggestion,
    nextSuggestionId,
    setSuggestionMessage
} from "../../lib/db";
import { suggestionsCh } from "../../config";
import { suggestionCard } from "../../lib/suggestionCard";

const suggest: Command = {
    name: "suggest",
    description: "Submit a suggestion for the server",
    aliases: ["sugg"],
    usage: "<suggestion>",
    examples: ["Add a meme channel"],
    messageRun: async (msg: Message, args?: string[]) => {
        if (!args?.length) {
            msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "Please provide your suggestion."
                    )
                ],
                flags: V2
            });
            return;
        }

        const channel = msg.guild?.channels.cache.get(
            suggestionsCh
        ) as TextChannel | undefined;
        if (!channel) {
            msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "The suggestions channel is not configured."
                    )
                ],
                flags: V2
            });
            return;
        }

        const id = await nextSuggestionId(msg.guildId!);

        await insertSuggestion(
            msg.guildId!,
            id,
            msg.author.id,
            args.join(" "),
            Date.now()
        );

        const posted = await channel
            .send({
                components: [
                    suggestionCard(
                        {
                            guild: msg.guildId!,
                            id,
                            user: msg.author.id,
                            content: args.join(" "),
                            status: "pending",
                            reason: null,
                            staff: null,
                            timestamp: Date.now()
                        },
                        { up: 0, down: 0 }
                    )
                ],
                flags: V2,
                allowedMentions: { parse: [] }
            })
            .catch(() => null);

        if (posted) {
            await setSuggestionMessage(msg.guildId!, id, posted.id);
            msg.reply({
                components: [
                    statusContainer(
                        "success",
                        `Your suggestion was created in ${channel} ${DOT} Suggestion #${id}`
                    )
                ],
                flags: V2
            });
        } else {
            msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "I couldn't post your suggestion."
                    )
                ],
                flags: V2
            });
        }
    }
};

export default suggest;
