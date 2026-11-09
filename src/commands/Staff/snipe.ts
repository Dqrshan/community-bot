import { Command } from "../../lib/command";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    TextChannel
} from "discord.js";
import Snipes, { snipeObject } from "../../lib/snipes";
import { DOT, errorEmbed } from "../../lib/response";

const snipe: Command = {
    name: "snipe",
    aliases: ["s"],
    staffOnly: true,
    description: "Retrieve recently deleted messages in a channel",
    usage: "[index] [#channel]",
    examples: ["15", "<#1031108420880842752>", "20 <#1031108420880842752>"],
    messageRun: async (msg: Message, args?: string[]) => {
        let index = 1;
        if (args?.[0] && !isNaN(parseInt(args[0]))) {
            index = parseInt(args[0]);
        }
        const channel = (msg.mentions.channels.first() ?? msg.channel) as TextChannel;

        const snipes: snipeObject[] = Snipes.get(channel.id)!;
        if (!snipes || !snipes.length) {
            return msg.reply({
                embeds: [
                    errorEmbed(
                        `I couldn't find any deleted messages in ${channel}.`
                    )
                ]
            });
        }

        const sniped = snipes[index - 1];
        if (!sniped) {
            return msg.reply({
                embeds: [
                    errorEmbed(
                        `Only ${snipes.length} deleted message(s) are stored for that channel.`
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

        const target =
            channel.id === msg.channelId ? "" : ` in ${channel}`;

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({
                name: `${user.displayName}${target}`,
                iconURL: user.displayAvatarURL(),
                url: `https://discord.com/users/${user.id}`
            })
            .setDescription(
                reference
                    ? `Replying to ${reference}\n${content}`
                    : content ?? "No content"
            )
            .setFields({
                name: "Deleted",
                value: `<t:${Math.round(timestamp / 1000)}:R>`,
                inline: false
            })
            .setFooter({
                text: `${message} ${DOT} ${index}/${snipes.length}`,
                iconURL: msg.client.user?.displayAvatarURL()
            });
        if (attachments.length === 1) embed.setImage(attachments[0]);
        else if (attachments.length > 1)
            embed.addFields({
                name: "Attachments",
                value: attachments
                    .map((v, i) => `[${i + 1}](${v})`)
                    .join(` ${DOT} `)
            });

        const rawEs: EmbedBuilder[] = [];
        embeds.forEach((em) => rawEs.push(new EmbedBuilder(em)));

        const link = new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(
                `https://discord.com/channels/${msg.guildId}/${channel.id}/${message}`
            )
            .setLabel("Origin");

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
                .reply({ embeds: rawEs, content: "Sniped embeds" })
                .catch(() => {});
        }
        return;
    }
};

export default snipe;
