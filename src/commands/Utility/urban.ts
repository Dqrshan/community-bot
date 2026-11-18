import {
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    TextChannel
} from "discord.js";
import { Command } from "../../lib/command";
import {
    card,
    COLORS,
    divider,
    statusContainer,
    text,
    V2
} from "../../lib/components";
import { DOT } from "../../lib/response";
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
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "Please provide a word to look up."
                    )
                ],
                flags: V2
            });
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
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        `I couldn't find any results for \`${query}\`.`
                    )
                ],
                flags: V2
            });
        }

        const pages: ContainerBuilder[] = (list as any[]).map((x, i) =>
            card(
                COLORS.info,
                text(`## [${x.word}](${x.permalink})`),
                text(`-# Urban Dictionary ${DOT} Result ${i + 1}`),
                divider(),
                text(clean(x.definition)),
                divider(),
                text(`**Example**\n${clean(x.example) || "None"}`),
                divider(),
                text(
                    `**Votes** ${DOT} 👍 ${x.thumbs_up.toLocaleString()} ${DOT} 👎 ${x.thumbs_down.toLocaleString()}`
                ),
                text(
                    `-# Requested by ${msg.author.username} ${DOT} Page ${
                        i + 1
                    } of ${list.length}`
                )
            )
        );

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

export default urban;

const clean = (x: string) => {
    const stripped = x.replaceAll("[", "").replaceAll("]", "");
    return stripped.length > 1000
        ? stripped.substring(0, 997) + "..."
        : stripped;
};
