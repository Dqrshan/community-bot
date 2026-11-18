import { Command } from "../../lib/command";
import { DOT } from "../../lib/response";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message,
    StringSelectMenuBuilder,
    TextChannel
} from "discord.js";
import {
    actionRow,
    card,
    COLORS,
    divider,
    gallery,
    linkButton,
    section,
    text,
    thumb,
    V2
} from "../../lib/components";
import {
    gradeRoles,
    activtyRoles,
    schoolRoles,
    pingRoles
} from "../../config";
import { stripIndents } from "common-tags";
import { emoji } from "../../lib/emojis";

const subs = ["roles", "ticket", "about"];

const command: Command = {
    name: "embed",
    description: "No",
    ownerOnly: true,
    messageRun: async (msg, args) => {
        if (!args?.length) return;
        const sub = args[0].toLowerCase();
        switch (sub) {
            case "roles":
                await Roles(msg);
                break;
            case "ticket":
                await Ticket(msg);
                break;
            case "about":
                await About(msg);
                break;
            default:
                msg.reply(
                    `Subcommands: ${subs.map((s) => `\`${s}\``).join(", ")}`
                );
                break;
        }
    }
};

export default command;

const Ticket = async (msg: Message) => {
    // Restored from the original embed panel: same copy and NEW button id.
    const container = card(
        COLORS.info,
        text(`# ${emoji("ticket")} Ticket`),
        text("To create a ticket, click the button below"),
        divider(),
        actionRow(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setLabel("Create Ticket")
                .setEmoji(emoji("ticket"))
                .setCustomId("NEW")
        )
    );

    await (msg.channel as TextChannel).send({
        components: [container],
        flags: V2
    });
    await msg.delete().catch(() => {});
};

const About = async (msg: Message) => {
    const welcome = card(
        COLORS.info,
        gallery([
            "https://cdn.discordapp.com/attachments/1036666970235490394/1140983448287318086/1.png"
        ], "Bangalore Hub banner"),
        text(stripIndents`
            # Welcome to **Bangalore Hub**
            Imagine a student hub where you can spend time, make new friends, and hangout!
        `)
    );

    const info = card(
        COLORS.info,
        gallery([
            "https://cdn.discordapp.com/attachments/1036666970235490394/1140983448509628497/2.png"
        ], "Server information"),
        text(stripIndents`
            ### INFO
            Most channels are self-explanatory and have respective topics.
            The main ones are listed below with a short description.
            ### MAIN
            ${DOT} ${getChannel("about", msg)} About this server.
            ${DOT} ${getChannel("rules", msg)} Rules & Guidelines.
            ${DOT} ${getChannel("news", msg)} Updates & Announcements regarding this server.
            ### COMMUNITY
            ${DOT} ${getChannel("leaderboard", msg)} Refreshing list of top 10 active members.
            ${DOT} ${getChannel("self-roles", msg)} User selectable roles.
            ${DOT} ${getChannel("starboard", msg)} Starred messages appear here.
            ${DOT} ${getChannel("suggestions", msg)} Suggest & Vote suggestions to improve the server.
            ${DOT} ${getChannel("qotw", msg)} **Q**uestion **O**f **T**he **W**eek.
            ### SUPPORT
            Create a ticket in ${getChannel("support", msg)} for queries / help & support / etc.
        `)
    );

    const roles = card(
        COLORS.info,
        gallery([
            "https://cdn.discordapp.com/attachments/1036666970235490394/1140983448803233922/3.png"
        ], "Server roles"),
        text(stripIndents`
            ### MAIN
            ${DOT} ${getRole("Lorenz", msg)} Technoking of Bangalore Hub aka <@838620835282812969>.
            ${DOT} ${getRole("Owner", msg)} Owners - <@838620835282812969> & <@433180057675104257>.
            ${DOT} ${getRole("Staff", msg)} Responsible & respected Staff.
            ${DOT} ${getRole("Boost", msg)} Hoisted role for Discord Nitro server boosters.
            ${DOT} ${getRole("Honoured", msg)} Hoisted role for other school server owners OR deserving members.
            ${DOT} ${getRole("Member", msg)} Members of the server.
            ${DOT} ${getRole("Bypass", msg)} Bypass automod restrictions.
            ### MISC
            ${DOT} Obtain more roles under ${getChannel("self-roles", msg)}.
            ${DOT} ${getRole("Bypass", msg)} requires you to have \`750+\` [\`seven hundred and fifty or more\` messages](</messages:960192961096871976>).
        `)
    );

    const links = card(
        COLORS.info,
        gallery([
            "https://cdn.discordapp.com/attachments/1036666970235490394/1140983449038098432/4.png"
        ], "Server links"),
        text(stripIndents`
            ### DISCORD
            ${DOT} [Vanity Invite Link](https://discord.gg/bangalore)
            ${DOT} [Permanent Invite Link](https://discord.com/invite/r6SaGMYYka)
            ### OFFICIAL
            ${DOT} [Website (Documentation)](https://lorenz1.gitbook.io/bangalore-hub)
            ${DOT} [Terms of Service](https://lorenz1.gitbook.io/bangalore-hub/tc/terms)
            ${DOT} [Privacy Policy](https://lorenz1.gitbook.io/bangalore-hub/tc/policy)
            ${DOT} [Discord Webpage](https://discord.com/servers/bangalore-hub-1023702510730494012)
            ### PUBLIC
            ${DOT} [Top.gg](https://top.gg/servers/1023702510730494012)
            ${DOT} [Discords.com](https://discords.com/servers/1023702510730494012)
            ${DOT} [Dyno.gg](https://dyno.gg/server/1023702510730494012/)
        `)
    );

    const first = await (msg.channel as TextChannel).send({
        components: [welcome],
        flags: V2
    });
    for (const container of [info, roles, links])
        await (msg.channel as TextChannel).send({
            components: [container],
            flags: V2
        });

    await (msg.channel as TextChannel).send({
        components: [
            card(
                COLORS.info,
                text("-# You can jump back to the top of the guide below."),
                actionRow(linkButton("Jump to top!", first.url))
            )
        ],
        flags: V2
    });

    return await msg.delete().catch(() => {});
};

const Roles = async (msg: Message) => {
    const header = () =>
        msg.guild!.iconURL({ size: 256 })
            ? thumb(msg.guild!.iconURL({ size: 256 })!, msg.guild!.name)
            : thumb(msg.client.user!.displayAvatarURL(), "Bot avatar");

    const gradeChunks = chunk(gradeRoles, 5);
    const grade = card(
        COLORS.info,
        section(
            [
                "## Grade Roles",
                "-# You can only select one role, open a ticket to change"
            ],
            header()
        ),
        divider(),
        text(
            gradeRoles
                .map((r) => `${getEmoji(msg, r.emoji)} ${DOT} <@&${r.role}>`)
                .join("\n")
        )
    );
    gradeChunks.forEach((rows) =>
        grade.addActionRowComponents(
            actionRow(
                ...rows.map((r) =>
                    new ButtonBuilder()
                        .setEmoji(r.emoji)
                        .setCustomId(`g-${r.role}`)
                        .setStyle(ButtonStyle.Secondary)
                )
            )
        )
    );

    const activity = card(
        COLORS.info,
        section(
            [
                "## Activity Roles",
                "-# You can select multiple roles"
            ],
            header()
        ),
        divider(),
        text(
            activtyRoles
                .map((r) => `${getEmoji(msg, r.emoji)} ${DOT} <@&${r.role}>`)
                .join("\n")
        ),
        actionRow(
            ...activtyRoles.map((r) =>
                new ButtonBuilder()
                    .setEmoji(r.emoji)
                    .setCustomId(`a-${r.role}`)
                    .setStyle(ButtonStyle.Secondary)
            )
        )
    );

    const pings = card(
        COLORS.info,
        section(
            [
                "## Ping Roles",
                "-# You can select multiple roles"
            ],
            header()
        ),
        divider(),
        text(
            pingRoles
                .map((d) => `${getEmoji(msg, d.emoji)} ${DOT} <@&${d.role}>`)
                .join("\n")
        ),
        actionRow(
            ...pingRoles.map((r) =>
                new ButtonBuilder()
                    .setEmoji(r.emoji)
                    .setCustomId(`p-${r.role}`)
                    .setStyle(ButtonStyle.Secondary)
            )
        )
    );

    const menu = new StringSelectMenuBuilder()
        .setPlaceholder("Select your school role..")
        .setCustomId("SCHOOL")
        .addOptions(
            schoolRoles.map((r) => ({
                label: `${getRoleName(msg, r)!}`,
                value: r
            }))
        );

    const school = card(
        COLORS.info,
        section(
            [
                "## School Roles",
                "-# Pick your school below"
            ],
            header()
        ),
        divider(),
        text(
            `If your school role isn't shown, open a ticket in <#1031159883673911336>.`
        ),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)
    );

    for (const container of [grade, activity, pings, school])
        await (msg.channel as TextChannel).send({
            components: [container],
            flags: V2
        });

};

const chunk = <T>(items: T[], size: number) => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size)
        chunks.push(items.slice(i, i + size));
    return chunks;
};

const getEmoji = (msg: Message, id: string) => {
    if (id.length <= 3) return id;
    const e = msg.client.emojis.cache.get(id)!;
    return `<:${e.name}:${e.id}>`;
};
const getRoleName = (msg: Message, role: string) => {
    return msg.guild?.roles.cache.get(role)!.name;
};

const getRole = (name: string, msg: Message) => {
    return msg.guild?.roles.cache.find((r) => r.name.includes(name));
};

const getChannel = (name: string, msg: Message) => {
    return msg.guild?.channels.cache.find(
        (c) =>
            c.name.includes(name) &&
            c.permissionsFor(msg.guild?.roles.everyone!).has("ViewChannel")
    );
};
