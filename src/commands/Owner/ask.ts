import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import { splitContent } from "../../lib/utils";
import { errorEmbed } from "../../lib/response";
import { ChatData } from "../../typings";

const command: Command = {
    name: "ask",
    description: "Ask the AI a question (owner only)",
    ownerOnly: true,
    aliases: ["gpt", "ai"],
    messageRun: async (msg: Message, args) => {
        if (!args || !args.length) {
            msg.reply({
                embeds: [errorEmbed("Please provide a query to ask.")]
            });
            return;
        }

        if (!process.env.AI_URL) {
            msg.reply({
                embeds: [errorEmbed("The AI endpoint is not configured.")]
            });
            return;
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
                embeds: [errorEmbed("The AI request failed.")]
            });
        }
        const data = (await res.json()) as ChatData;

        if (data.response) {
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setAuthor({
                    name: query.slice(0, 200),
                    iconURL: msg.author.displayAvatarURL()
                });
            let r = data.response;
            if (r.length > 3900) {
                for (const str of splitContent(r, 3900)) {
                    await (msg.channel as TextChannel)
                        .send({ embeds: [embed.setDescription(str.slice(0, 4096))] })
                        .catch(() => {});
                }
            } else {
                await msg
                    .reply({ embeds: [embed.setDescription(r)] })
                    .catch(() => {});
            }
        } else {
            await msg.reply({
                embeds: [errorEmbed("The AI returned no response.")]
            });
        }
    }
};

export default command;
