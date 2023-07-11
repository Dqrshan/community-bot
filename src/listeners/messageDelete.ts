import { Message } from "discord.js";
import Snipes from "../utils/snipes";

export default async function run(msg: Message) {
    if (msg.system || !msg.author || msg.author.bot || msg.webhookId || !msg.guild) return;
    let reference = null;
    const attachments: string[] = [];
    if (msg.attachments.size)
        msg.attachments.map((a) => attachments.push(a.proxyURL));
    if (msg.reference) reference = (await msg.fetchReference()).url;

    await Snipes.set(msg.client, msg.channelId, {
        message: msg.id,
        content: msg.content,
        author: msg.author.id,
        attachments,
        embeds: msg.embeds.length ? msg.embeds.map((e) => e.toJSON()) : [],
        timestamp: Date.now(),
        reference,
    });
}
