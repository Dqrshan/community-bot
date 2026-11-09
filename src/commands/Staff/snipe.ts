import { Command } from "../../lib/command";
import {
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    Message,
    TextChannel
} from "discord.js";
import Snipes, { snipeObject } from "../../lib/snipes";

const snipe: Command = {
    name: "snipe",
    aliases: ["s"],
    staffOnly: true,
    description: "Retrieve recently deleted messages in a channel",
    usage: "[index] [#channel]",
    examples: ["15", "<#1031108420880842752>", "20 <#1031108420880842752>"],
    messageRun: async (msg: Message, args?: string[]) => {
        let index: number = 1;
        if (args?.[0] && !isNaN(parseInt(args[0]))) {
            index = parseInt(args[0]);
        }
        const channel = (msg.mentions.channels.first() ?? msg.channel) as TextChannel;

        const snipes: snipeObject[] = Snipes.get(channel.id)!;
        if (!snipes || !snipes.length) {
            return msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription("💀 Nothing to snipe here!")
                ]
            });
        }

        const sniped = snipes[index - 1];
        if (!sniped) {
            return msg.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Orange")
                        .setDescription(
                            `⚠️ There are only \`${snipes.length}\` deleted message(s) stored for this channel.`
                        )
                ]
            });
        }

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
        const member = await msg.guild?.members
            .fetch(user.id)
            .catch(() => null);
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({
                name: user.displayName,
                iconURL: user.displayAvatarURL(),
                url: `https://discord.com/users/${user.id}`
            })
            .setThumbnail(
                member ? member.displayAvatarURL() : user.displayAvatarURL()
            )
            .setTitle(
                `Deleted${
                    channel.id === msg.channelId ? "" : ` in #${channel.name}`
                } <t:${Math.round(timestamp / 1000)}:R>`
            )
            .setFooter({
                text: `${message} • ${index}/${snipes.length}`,
                iconURL: msg.client.user?.displayAvatarURL()
            });
        if (content)
            embed.setDescription(
                reference
                    ? `╭ *replying to ${reference}*\n${content}`
                    : content
            );
        if (attachments.length === 1) embed.setImage(attachments[0]);
        else if (attachments.length > 1)
            embed.addFields({
                name: "Attachments",
                value: attachments
                    .map((v, i) => `[${i + 1}](${v})`)
                    .join("・")
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
                    content: "📎 Sniped Embeds"
                })
                .catch(() => {});
        }
        return;
    }
};

export default snipe;
