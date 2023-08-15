import {
    ActionRowBuilder,
    AttachmentBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    TextChannel
} from "discord.js";
import Snipes from "../lib/snipes";
import { audit } from "../config";

export default async function run(msg: Message) {
    if (
        msg.system ||
        !msg.author ||
        msg.author.bot ||
        msg.webhookId ||
        !msg.guild
    )
        return;
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
        reference
    });

    const deleted = new EmbedBuilder()
        .setColor("Red")
        .setTitle(
            `Deleted in ${msg.channel.toString()} (<t:${Math.floor(
                Date.now() / 1000
            )}:R>)`
        )
        .setDescription(
            (reference
                ? `╭ *replying to ${reference}*\n${msg.content}`
                : msg.content) ?? "No content/uncached"
        )
        .setFooter({
            text: msg.id,
            iconURL:
                "https://media.discordapp.net/attachments/929953693833527307/1099705712298434750/906948621486944288.png"
        })
        .setAuthor({
            name: msg.author.tag,
            iconURL: msg.author.displayAvatarURL()
        });

    await (msg.client.channels.cache.get(audit) as TextChannel)
        .send({
            embeds: [deleted].concat(
                msg.embeds.length
                    ? msg.embeds.map((e) => EmbedBuilder.from(e.toJSON()))
                    : []
            ),
            files: msg.attachments.size
                ? msg.attachments.map(
                      (a) => new AttachmentBuilder(a.proxyURL, { name: a.name })
                  )
                : [],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(
                    new ButtonBuilder()
                        .setStyle(ButtonStyle.Link)
                        .setLabel("Jump")
                        .setURL(msg.url)
                )
            ]
        })
        .catch((e) => msg.client.console.error(e));
}
