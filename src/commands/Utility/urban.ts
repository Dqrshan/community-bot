import { ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { Command } from "../../lib/command";
import axios from "axios";
import { Pagination } from "../../lib/pagination";

const urban: Command = {
    name: "urban",
    description: "Urban Dictionary",
    aliases: ["dictionary", "define"],
    usage: "<query>",
    examples: ["Darshan"],
    messageRun: async (msg, args) => {
        if (!args?.length) {
            msg.reply("Please input a query!");
            return;
        }
        msg.channel.sendTyping();
        const query = args.join(" ");
        const {
            data: { list }
        } = await axios.get(
            `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(
                query
            )}`
        );
        if (!list) {
            msg.reply("I couldn't find what you were looking for!");
            return;
        }

        const pages: EmbedBuilder[] = [];
        // const [fetch] = list;
        (list as any[]).forEach((x) => {
            const em = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle(x.word)
                .setURL(x.permalink)
                .setDescription(clean(x.definition))
                .addFields(
                    {
                        name: "Example",
                        value: clean(x.example) ?? "None",
                        inline: true
                    },
                    {
                        name: "Votes",
                        value: `👍 ${x.thumbs_up}・👎 ${x.thumbs_down}`,
                        inline: true
                    }
                );

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
    return x.length > 1000
        ? x.replaceAll("[", "").replaceAll("]", "").substring(0, 997) + "..."
        : x.replaceAll("[", "").replaceAll("]", "");
};
