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
    GuildMember,
    MessageFlags,
    ModalBuilder,
    ModalSubmitInteraction,
    OverwriteType,
    PermissionFlagsBits,
    TextChannel,
    TextInputBuilder,
    TextInputStyle,
    User
} from "discord.js";
import { setTicketCount, ticketCount } from "./db";
import { links, staff, ticketCategory, ticketLogs } from "../config";
import { createTranscript } from "discord-html-transcripts";
import { sleep } from "./utils";
import {
    actionRow,
    attachmentRow,
    card,
    COLORS,
    divider,
    linkButton,
    section,
    statusContainer,
    text,
    thumb,
    V2
} from "./components";
import { DOT } from "./response";

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
        const guildId = interaction.guildId!;
        const counter = await ticketCount(guildId);
        await setTicketCount(guildId, counter + 1);

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

        const container = card(
            COLORS.danger,
            section(
                [
                    `## Ticket Deleted ${DOT} ${this.ticketNumber}`,
                    `-# Closed by ${member.user.username}`
                ],
                thumb(
                    this.user.displayAvatarURL({ size: 128 }),
                    this.user.username
                )
            ),
            divider(),
            text(
                `**Created by** ${DOT} ${this.user.toString()}\n` +
                    `**Reason** ${DOT} ${this.reason}\n` +
                    `**Closed by** ${DOT} ${member.user.toString()}` +
                    (note ? `\n**Note** ${DOT} ${note}` : "")
            ),
            text(
                `-# ${this.user.id} ${DOT} <t:${Math.round(
                    Date.now() / 1000
                )}:R>`
            )
        );

        (
            (await member.client.channels.cache.get(ticketLogs)) as TextChannel
        ).send({
            components: [container],
            flags: V2
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

        const container = card(
            COLORS.info,
            section(
                [
                    `## Transcript ${DOT} ${this.ticketNumber}`,
                    `-# ${this.user.username}`
                ],
                thumb(
                    this.user.displayAvatarURL({ size: 128 }),
                    this.user.username
                )
            ),
            divider(),
            text(
                `**Created by** ${DOT} ${this.user.toString()}\n` +
                    `**Reason** ${DOT} ${this.reason}\n` +
                    `**Closed by** ${DOT} ${member.user.toString()}\n` +
                    `**Total messages** ${DOT} ${this.channel!.messages.cache.size.toLocaleString()}`
            ),
            text(
                `-# ${this.user.id} ${DOT} <t:${Math.round(
                    Date.now() / 1000
                )}:R>`
            ),
            divider(),
            attachmentRow(transcript.name ?? "transcript.html")
        );

        return await (
            member.client.channels.cache.get(ticketLogs) as TextChannel
        ).send({
            components: [container],
            files: [transcript],
            flags: V2
        });
    }
}

export const tickets = new Collection<string, Ticket>();
let deleting = false;
export const isDeleting = () => deleting;

export const askReasonForTicket = (ctx: ButtonInteraction) => {
    if (tickets.has(ctx.user.id))
        return ctx.reply({
            components: [
                statusContainer(
                    "error",
                    `You already have a ticket open: ${
                        tickets.get(ctx.user.id)!.channel
                    }`
                )
            ],
            flags: V2 | MessageFlags.Ephemeral
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

    const welcome = card(
        COLORS.info,
        section(
            [
                `## Ticket ${DOT} ${ticket.ticketNumber}`,
                `Welcome ${ticket.user}, our ${staff
                    .map((r) => `<@&${r}>`)
                    .join(" ")} will be with you shortly.`,
                `-# Opened by ${ticket.user.username}`
            ],
            thumb(
                ticket.user.displayAvatarURL({ size: 128 }),
                ticket.user.username
            )
        ),
        divider(),
        text(
            `> Please explain your question in detail so that our staff can help you.\n> This ticket will automatically be deleted <t:${
                Math.round(Date.now() / 1000) + 5 * 60
            }:R> if you don't reply.`
        ),
        actionRow(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setLabel("Close")
                .setEmoji("🔒")
                .setCustomId("CLOSE"),
            linkButton("Rules", links.rules),
            linkButton("ToS", links.terms)
        )
    );

    ticket.channel.send({ components: [welcome], flags: V2 });

    interaction.reply({
        components: [
            statusContainer("success", `Ticket created ${DOT} ${ticket.channel}`)
        ],
        flags: V2 | MessageFlags.Ephemeral
    });

    const opened = card(
        COLORS.success,
        section(
            [
                `## Ticket Opened ${DOT} ${ticket.ticketNumber}`,
                `-# ${ticket.user.username}`
            ],
            thumb(
                ticket.user.displayAvatarURL({ size: 128 }),
                ticket.user.username
            )
        ),
        divider(),
        text(
            `**Created by** ${DOT} ${ticket.user.toString()}\n**Reason** ${DOT} ${ticket.reason}`
        ),
        text(
            `-# ${ticket.user.id} ${DOT} <t:${Math.round(
                Date.now() / 1000
            )}:R>`
        )
    );

    await (
        interaction.guild!.channels.cache.get(ticketLogs)! as TextChannel
    ).send({
        components: [opened],
        flags: V2
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
            components: [
                statusContainer(
                    "info",
                    "The bot is currently deleting another ticket, please wait."
                )
            ],
            flags: V2 | MessageFlags.Ephemeral
        });
    const ticket: Ticket = tickets.find(
        (t: Ticket) => t.channel?.id === ctx.channelId
    )!;
    ctx.reply({
        components: [statusContainer("info", "Deleting ticket..")],
        flags: V2 | MessageFlags.Ephemeral
    });
    return ticket.delete(ctx.member! as GuildMember);
};
