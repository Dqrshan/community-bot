import { ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import { DOT, errorEmbed } from "../../lib/response";
import axios from "axios";
import { Pagination } from "../../lib/pagination";

const urban: Command = {
    name: "urban",
    description: "Look up words on Urban Dictionary",
    aliases: ["dictionary", "define", "ud"],
    usage: "<query>",
    examples: [" Bangalore", " Based"],
    messageRun: async (msg, args) => {
        if (!args?.length) {
            msg.reply({
                embeds: [errorEmbed("Please provide a word to look up.")]
            });
            return;
        }
        await (msg.channel as TextChannel).sendTyping();
        const query = args.join(" ");
        const {
            data: { list }
        } = await axios.get(
            `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(
                query
            )}`
        );
        if (!list || !list.length) {
            msg.reply({
                embeds: [
                    errorEmbed(
                        `I couldn't find any results for \`${query}\`.`
                    )
                ]
            });
            return;
        }

        const pages: EmbedBuilder[] = (list as any[]).map((x) => {
            const em = new EmbedBuilder()
                .setColor("Blurple")
                .setAuthor({ name: "Urban Dictionary" })
                .setTitle(x.word)
                .setURL(x.permalink)
                .setDescription(clean(x.definition))
                .addFields(
                    {
                        name: "Example",
                        value: clean(x.example) || "None",
                        inline: false
                    },
                    {
                        name: "Votes",
                        value: `Upvotes ${DOT} ${x.thumbs_up.toLocaleString()}\nDownvotes ${DOT} ${x.thumbs_down.toLocaleString()}`,
                        inline: false
                    }
                )
                .setFooter({
                    text: `Requested by ${msg.author.username}`,
                    iconURL: msg.author.displayAvatarURL()
                });
            return em;
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

export default urban;

const clean = (x: string) => {
    const stripped = x.replaceAll("[", "").replaceAll("]", "");
    return stripped.length > 1000
        ? stripped.substring(0, 997) + "..."
        : stripped;
};
