import { Command } from "../../lib/command";
import { splitContent } from "../../lib/utils";

const command: Command = {
    name: "ask",
    description: "Ask ChatGPT!",
    ownerOnly: true,
    aliases: ["gpt"],
    messageRun: async (msg, args) => {
        if (!args || !args.length) {
            msg.reply("Provide a query to ask");
            return;
        }

        const query = args.join(" ");
        await msg.channel.sendTyping();

        const res = await fetch(process.env.AI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: `${query}`
                    }
                ]
            })
        });
        if (!res.ok) return await msg.react("❌");
        const data = await res.json();

        if (data.response) {
            let r = data.response;
            if (r.length > 2000) {
                const strs = splitContent(r, 2000);
                for (const str of strs) {
                    if (strs.indexOf(str) === 0) {
                        await msg.reply(str).catch(() => {});
                        continue;
                    } else {
                        await msg.channel.send(str).catch(() => {});
                    }
                }
            } else {
                await msg.reply(r).catch(() => {});
            }
        } else {
            await msg.react("❌");
        }
    }
};

export default command;
