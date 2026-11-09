import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    TextChannel
} from "discord.js";
import { Command } from "../../lib/command";
import { DOT, errorEmbed, successEmbed } from "../../lib/response";
import {
    insertSuggestion,
    nextSuggestionId,
    setSuggestionMessage
} from "../../lib/db";
import { suggestionsCh } from "../../config";

const INDIGO = 0x4b0082;

const suggest: Command = {
    name: "suggest",
    description: "Submit a suggestion for the server",
    aliases: ["sugg"],
    usage: "<suggestion>",
    examples: ["Add a meme channel"],
    messageRun: async (msg: Message, args?: string[]) => {
        if (!args?.length) {
            msg.reply({
                embeds: [errorEmbed("Please provide your suggestion.")]
            });
            return;
        }

        const channel = msg.guild?.channels.cache.get(
            suggestionsCh
        ) as TextChannel | undefined;
        if (!channel) {
            msg.reply({
                embeds: [errorEmbed("The suggestions channel is not configured.")]
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

        const accent =
            msg.guild?.members.me &&
            msg.guild.members.me.displayHexColor !== "#000000"
                ? msg.guild.members.me.displayHexColor
                : INDIGO;

        const embed = new EmbedBuilder()
            .setColor(accent)
            .setAuthor({
                name: msg.author.username,
                iconURL: msg.author.displayAvatarURL()
            })
            .setDescription(args.join(" "))
            .addFields({
                name: "Votes",
                value: `Upvotes ${DOT} 0\nDownvotes ${DOT} 0`,
                inline: false
            })
            .setFooter({ text: `Suggestion ${id}` })
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setLabel("Upvote")
                .setCustomId(`su_${msg.guildId}_${id}`)
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setLabel("Downvote")
                .setCustomId(`sd_${msg.guildId}_${id}`)
                .setStyle(ButtonStyle.Danger)
        );

        const posted = await channel
            .send({ embeds: [embed], components: [row] })
            .catch(() => null);

        if (posted) {
            await setSuggestionMessage(msg.guildId!, id, posted.id);
            msg.reply({
                embeds: [
                        successEmbed(
                            `Your suggestion was created in ${channel} ${DOT} Suggestion #${id}`
                        )
                ]
            });
        } else {
            msg.reply({
                embeds: [errorEmbed("I couldn't post your suggestion.")]
            });
        }
    }
};

export default suggest;
