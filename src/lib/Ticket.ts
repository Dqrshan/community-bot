/**
 * @link https://github.com/siriscmv/invite-management-utility
 */
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    Collection,
    EmbedBuilder,
    GuildMember,
    ModalBuilder,
    ModalSubmitInteraction,
    OverwriteType,
    PermissionFlagsBits,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    User
} from "discord.js";
import prisma from "../prisma/prisma";
import { links, staff, ticketCategory, ticketLogs } from "../config";
import { createTranscript } from "discord-html-transcripts";
import { sleep } from "./utils";

export default class Ticket {
    ticketNumber: number;
    user: User;
    channel: TextChannel | null;
    reason: string;

    constructor(
        ticketNumber: number,
        user: User,
        channel: TextChannel | null,
        reason: string
    ) {
        this.ticketNumber = ticketNumber;
        this.user = user;
        this.channel = channel;
        this.reason = reason;
    }

    public static async fromInteraction(
        interaction: ModalSubmitInteraction | ButtonInteraction
    ) {
        const counter =
            (await prisma.settings.findUnique({
                where: { guild: interaction.guildId! }
            }))!?.ticketCount ?? 0;
        await prisma.settings.upsert({
            where: { guild: interaction.guildId! },
            update: { ticketCount: counter + 1 },
            create: { ticketCount: counter + 1, guild: interaction.guildId! }
        });

        return new Ticket(
            counter + 1,
            interaction.user,
            null,
            // @ts-ignore
            interaction.components[0].components[0].value
        );
    }

    public async delete(member: GuildMember, note?: string) {
        await this.log(member);

        const embed = new EmbedBuilder()
            .setAuthor({
                name: this.user.tag,
                iconURL: this.user.displayAvatarURL()
            })
            .setTitle(`Ticket Deleted - ${this.ticketNumber}`)
            .setFields([
                {
                    name: "Created by",
                    value: this.user.toString(),
                    inline: true
                },
                {
                    name: "Reason",
                    value: this.reason,
                    inline: true
                },
                {
                    name: "Closed by",
                    value: member.user.toString(),
                    inline: true
                }
            ])
            .setColor("Red")
            .setFooter({
                text: this.user.id
            })
            .setTimestamp();

        if (note) embed.addFields({ name: "Note", value: note, inline: true });
        (
            (await member.client.channels.cache.get(ticketLogs)) as TextChannel
        ).send({
            embeds: [embed]
        });

        tickets.delete(this.user.id);
        this.channel!.messages.cache.clear();
        return this.channel!.delete();
    }

    private async log(member: GuildMember) {
        deleting = true;

        const transcript = await createTranscript(this.channel!, {
            poweredBy: false
        });

        deleting = false;

        const em = new EmbedBuilder()
            .setTitle(`Transcript - ${this.ticketNumber}`)
            .setColor("Blurple")
            .setAuthor({
                name: this.user.tag,
                iconURL: this.user.displayAvatarURL()
            })
            .setThumbnail(this.user.displayAvatarURL())
            .setFooter({ text: this.user.id })
            .setTimestamp()
            .setFields([
                {
                    name: "Created By",
                    value: this.user.toString(),
                    inline: true
                },
                {
                    name: "Reason",
                    value: this.reason,
                    inline: true
                },
                {
                    name: "Closed By",
                    value: member.user.toString(),
                    inline: true
                },
                {
                    name: "Total Messages",
                    value: this.channel!.messages.cache.size.toLocaleString(),
                    inline: true
                }
            ]);

        return await (
            member.client.channels.cache.get(ticketLogs) as TextChannel
        ).send({
            embeds: [em],
            files: [transcript]
        });
    }
}

export const tickets = new Collection<string, Ticket>();
let deleting = false;
export const isDeleting = () => deleting;

export const askReasonForTicket = (ctx: ButtonInteraction) => {
    if (tickets.has(ctx.user.id))
        return ctx.reply({
            content: `You already have a ticket open: ${
                tickets.get(ctx.user.id)!.channel
            }`,
            ephemeral: true
        });

    const inputRow = new ActionRowBuilder<TextInputBuilder>().setComponents([
        new TextInputBuilder()
            .setPlaceholder("Enter the reason for ticket")
            .setMinLength(5)
            .setMaxLength(100)
            .setStyle(TextInputStyle.Short)
            .setCustomId("REASON")
            .setRequired()
            .setLabel("Ticket Reason")
    ]);

    const modal = new ModalBuilder()
        .setCustomId("CREATE_TICKET")
        .setTitle("Create Ticket")
        .addComponents(inputRow);

    return ctx.showModal(modal);
};

export const createTicket = async (
    interaction: ModalSubmitInteraction | ButtonInteraction
) => {
    const ticket = await Ticket.fromInteraction(interaction);
    ticket.channel = (await interaction.guild!.channels.create({
        name: `ticket-${ticket.ticketNumber}`,
        parent: ticketCategory,
        type: ChannelType.GuildText,
        topic: ticket.reason,
        permissionOverwrites: [
            ...staff.map((staff) => ({
                id: staff,
                type: OverwriteType.Role,
                allow: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.AddReactions,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.AttachFiles
                ]
            })),
            {
                id: ticket.user.id,
                type: OverwriteType.Member,
                allow: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.AttachFiles
                ]
            },
            {
                id: interaction.guild!.id,
                type: OverwriteType.Role,
                deny: [
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ViewChannel
                ]
            }
        ]
    })) as TextChannel;
    tickets.set(ticket.user.id, ticket);

    const emb = new EmbedBuilder()
        .setColor("Blurple")
        .setAuthor({
            name: ticket.user.tag,
            iconURL: ticket.user.avatarURL()!
        })
        .setDescription(
            `> ・Explain your question in detail so that our staff can help you.\n> ・This ticket will automatically be deleted <t:${
                Math.round(Date.now() / 1000) + 5 * 60
            }:R> if you don't reply.`
        );

    const btns = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setLabel("Close")
            .setCustomId("CLOSE"),
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(links.rules)
            .setLabel("Rules"),
        new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(links.terms)
            .setLabel("ToS")
    );

    ticket.channel.send({
        content: `Welcome ${
            ticket.user
        }, please wait patiently for our ${staff.map(
            (r) => `<@&${r}>`
        )} to reply!`,
        embeds: [emb],
        components: [btns]
    });

    interaction.reply({
        content: ticket.channel.toString(),
        ephemeral: true
    });

    const em = new EmbedBuilder()
        .setAuthor({
            name: ticket.user.tag,
            iconURL: ticket.user.displayAvatarURL()
        })
        .setThumbnail(ticket.user.displayAvatarURL())
        .setTitle(`Ticket Opened - ${ticket.ticketNumber}`)
        .setColor("Green")
        .setFields(
            {
                name: "Created by",
                value: ticket.user.toString(),
                inline: true
            },
            {
                name: "Reason",
                value: ticket.reason,
                inline: true
            }
        )
        .setTimestamp();

    await (
        interaction.guild!.channels.cache.get(ticketLogs)! as TextChannel
    ).send({
        embeds: [em]
    });

    await sleep(5 * 60 * 1000);
    const close =
        (await ticket.channel.messages.fetch()).filter(
            (m) => m.author.id === ticket.user.id
        ).size === 0;

    if (!close) return;
    ticket.user
        .send(
            "Your ticket was automatically deleted because you did not send a message within 5 minutes of making the ticket. If you need help, please open a new ticket."
        )
        .catch(() => {});
    await ticket.delete(interaction.guild!.members.me!, "User did not respond");
    return;
};

export const deleteTicket = (ctx: ButtonInteraction) => {
    if (isDeleting())
        return ctx.reply({
            content:
                "The bot is currently deleting another ticket, please wait.",
            ephemeral: true
        });
    const ticket: Ticket = tickets.find(
        (t: Ticket) => t.channel?.id === ctx.channelId
    )!;
    ctx.reply({ content: "Deleting ticket..", ephemeral: true });
    return ticket.delete(ctx.member! as GuildMember);
};
