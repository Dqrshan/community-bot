import { ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import axios from "axios";
import { Pagination } from "../../lib/pagination";

const urban: Command = {
    name: "urban",
    description: "Look up words on Urban Dictionary",
    aliases: ["dictionary", "define", "ud"],
    usage: "<query>",
    examples: ["Darshan", " Based"],
    messageRun: async (msg, args) => {
        if (!args?.length) {
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            "❌ Please provide a word to look up!"
                        )
                ]
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
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            "❌ I couldn't find what you were looking for!"
                        )
                ]
            });
            return;
        }

        const pages: EmbedBuilder[] = [];
        (list as any[]).forEach((x) => {
            const em = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle(x.word)
                .setURL(x.permalink)
                .setAuthor({ name: "📖 Urban Dictionary" })
                .setDescription(clean(x.definition))
                .addFields(
                    {
                        name: "✏️ Example",
                        value: clean(x.example) || "None",
                        inline: false
                    },
                    {
                        name: "Votes",
                        value: `👍 ${x.thumbs_up.toLocaleString()}・👎 ${x.thumbs_down.toLocaleString()}`,
                        inline: true
                    }
                )
                .setFooter({
                    text: `Requested by ${msg.author.username}`,
                    iconURL: msg.author.displayAvatarURL()
                });

            pages.push(em);
        });

        await Pagination(msg, "", pages, [
            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("P")
                .setEmoji("⬅️"),
            new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("N")
                .setEmoji("➡️")
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
