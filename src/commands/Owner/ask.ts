import { Message, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import {
    card,
    COLORS,
    divider,
    section,
    statusContainer,
    text,
    thumb,
    V2
} from "../../lib/components";
import { askAI } from "../../lib/ai";
import { splitContent } from "../../lib/utils";

const command: Command = {
    name: "ask",
    description: "Ask the AI a question (owner only)",
    ownerOnly: true,
    aliases: ["gpt", "ai"],
    messageRun: async (msg: Message, args) => {
        if (!args || !args.length) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "Please provide a query to ask."
                    )
                ],
                flags: V2
            });
        }

        const query = args.join(" ");
        await (msg.channel as TextChannel).sendTyping();

        let response: string;
        try {
            response = await askAI(query);
        } catch (error) {
            msg.client.console.error(error);
            return msg.reply({
                components: [
                    statusContainer("error", "The AI request failed.")
                ],
                flags: V2
            });
        }

        const chunks =
            response.length > 3400
                ? splitContent(response, 3400)
                : [response];

        for (const [i, chunk] of chunks.entries()) {
            const container = card(
                COLORS.info,
                ...(i === 0
                    ? [
                          section(
                              [
                                  `## ${query.slice(0, 200)}`,
                                  "-# Sudeep's response"
                              ],
                              thumb(
                                  msg.client.user!.displayAvatarURL({
                                      size: 128
                                  }),
                                  "Bot avatar"
                              )
                          ),
                          divider()
                      ]
                    : [text(`-# Continued (${i + 1}/${chunks.length})`)]),
                text(chunk)
            );

            if (i === 0)
                await msg
                    .reply({ components: [container], flags: V2 })
                    .catch(() => {});
            else
                await (msg.channel as TextChannel)
                    .send({ components: [container], flags: V2 })
                    .catch(() => {});
        }
    }
};

export default command;
