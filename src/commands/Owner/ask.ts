import { EmbedBuilder, Message, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import { splitContent } from "../../lib/utils";
import { ChatData } from "../../typings";

const command: Command = {
    name: "ask",
    description: "Ask the AI a question (owner only)",
    ownerOnly: true,
    aliases: ["gpt", "ai"],
    messageRun: async (msg: Message, args) => {
        if (!args || !args.length) {
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setDescription("⚠️ Provide a query to ask!")
                ]
            });
            return;
        }

        const query = args.join(" ");
        await (msg.channel as TextChannel).sendTyping();

        if (!process.env.AI_URL) {
            msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("❌ AI endpoint is not configured.")
                ]
            });
            return;
        }
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
        if (!res.ok) return await msg.react("❌");
        const data = (await res.json()) as ChatData;

        if (data.response) {
            let r = data.response;
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setAuthor({
                    name: `Asked: ${query.slice(0, 200)}`,
                    iconURL: msg.author.displayAvatarURL()
                });
            if (r.length > 3900) {
                const strs = splitContent(r, 3900);
                for (const str of strs) {
                    await (msg.channel as TextChannel)
                        .send({
                            embeds: [embed.setDescription(str.slice(0, 4096))]
                        })
                        .catch(() => {});
                }
            } else {
                await msg
                    .reply({ embeds: [embed.setDescription(r)] })
                    .catch(() => {});
            }
        } else {
            await msg.react("❌");
        }
    }
};

export default command;
