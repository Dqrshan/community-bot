import { Message } from "discord.js";
import type { Command } from "../../lib/command";

const ping: Command = {
    name: "ping",
    description: "Latency of the bot",
    messageRun: async (msg: Message) => {
        return msg.reply(`🏓 Pong! \`${msg.client.ws.ping}\`ms`);
    }
};

export default ping;
