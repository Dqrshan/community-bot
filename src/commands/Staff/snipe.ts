import { Command } from "../../lib/command";
import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Message
} from "discord.js";
import Snipes, { snipeObject } from "../../utils/snipes";

const snipe: Command = {
    name: "snipe",
    aliases: ["s"],
    staffOnly: true,
    description: "Snipe deleted messages",
    messageRun: async (msg: Message, args?: string[]) => {
        let index: number = 1;
        if (!args?.length) {
            index = 1;
        } else if (args[0] && !isNaN(parseInt(args[0]))) {
            index = parseInt(args[0]);
        }
        const channel = msg.mentions.channels.first() ?? msg.channel;

        const snipes: snipeObject[] = Snipes.get(channel.id)!;
        if (!snipes || !snipes.length) return msg.reply("Nothing to snipe!");

        const sniped = snipes[index - 1];
        if (!sniped)
            return msg.reply(
                `There are only ${snipes.length} deleted message(s) in the database`
            );

        const {
            message,
            content,
            author,
            attachments,
            embeds,
            timestamp,
            reference
        } = sniped;

        const user = await msg.client.users.fetch(author!);
        const member = await msg.guild?.members.fetch(user.id);
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({
                name: user.tag,
                iconURL: user.displayAvatarURL()
            })
            .setThumbnail(
                member ? member.displayAvatarURL() : user.displayAvatarURL()
            )
            .setTitle(
                `Deleted${
                    channel.id === msg.channelId ? "" : ` in <#${channel.id}>`
                } <t:${Math.round(timestamp / 1000)}:R>`
            )
            .setFooter({
                text: `${message} | ${index}/${snipes.length}`,
                iconURL:
                    "https://media.discordapp.net/attachments/929953693833527307/1099705712298434750/906948621486944288.png"
            });
        if (content)
            embed.setDescription(
                reference ? `╭ *replying to ${reference}*\n${content}` : content
            );
        if (attachments.length === 1) embed.setImage(attachments[0]);
        else if (attachments.length === 0) {
        } else
            embed.setFields({
                name: "Attachments",
                value: attachments.length
                    ? attachments.map((v, i) => `[${i + 1}](${v})`).join("・")
                    : "None"
            });

        const rawEs: EmbedBuilder[] = [];
        embeds.forEach((em) => rawEs.push(new EmbedBuilder(em)));

        const link = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(
                `https://discord.com/channels/${msg.guildId}/${channel.id}/${message}`
            )
            .setLabel("Origin")
            .setEmoji("🔗");

        const i = await msg
            .reply({
                embeds: [embed],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().setComponents(link)
                ]
            })
            .catch(() => {});

        if (rawEs.length) {
            await (i as Message)
                .reply({
                    embeds: rawEs,
                    content: "Sniped Embeds"
                })
                .catch(() => {});
        }
        return;
    }
};

export default snipe;
