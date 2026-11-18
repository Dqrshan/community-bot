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
import { splitContent } from "../../lib/utils";
import { ChatData } from "../../typings";

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

        if (!process.env.AI_URL) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "The AI endpoint is not configured."
                    )
                ],
                flags: V2
            });
        }

        const query = args.join(" ");
        await (msg.channel as TextChannel).sendTyping();

        const res = await fetch(process.env.AI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: query
                    }
                ]
            })
        });
        if (!res.ok) {
            return msg.reply({
                components: [
                    statusContainer("error", "The AI request failed.")
                ],
                flags: V2
            });
        }
        const data = (await res.json()) as ChatData;

        if (!data.response) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "The AI returned no response."
                    )
                ],
                flags: V2
            });
        }

        const chunks =
            data.response.length > 3400
                ? splitContent(data.response, 3400)
                : [data.response];

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
