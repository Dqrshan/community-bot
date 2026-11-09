import { Command } from "../../lib/command";
import { DOT } from "../../lib/response";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    StringSelectMenuBuilder,
    TextChannel
} from "discord.js";
import {
    gradeRoles,
    activtyRoles,
    schoolRoles,
    pingRoles
} from "../../config";
import { stripIndents } from "common-tags";

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
    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle("Ticket")
        .setDescription("To create a ticket, click the button below");
    const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
        new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setLabel("Create Ticket")
            .setCustomId("NEW")
    );

    (msg.channel as TextChannel).send({ embeds: [embed], components: [button] });
    await msg.delete().catch(() => {});
};

const About = async (msg: Message) => {
    const base = new EmbedBuilder().setColor("Blurple");
    const about = EmbedBuilder.from(base).setImage(
        "https://cdn.discordapp.com/attachments/1036666970235490394/1140983448287318086/1.png"
    ).setDescription(stripIndents`
### Welcome to the **Bangalore Hub** Discord server!

Imagine a student hub where you can spend time, make new friends, and hangout!
    `);

    const info = EmbedBuilder.from(base).setImage(
        "https://cdn.discordapp.com/attachments/1036666970235490394/1140983448509628497/2.png"
    ).setDescription(stripIndents`
### INFO
Most channels are self-explanatory and have respective topics. 
The main ones are listed below with a short description.
### MAIN
${DOT} ${getChannel("about", msg)} About this server.
${DOT} ${getChannel("rules", msg)} Rules & Guidelines.
${DOT} ${getChannel("news", msg)} Updates & Announcements regarding this server.
### COMMUNITY
${DOT} ${getChannel(
        "leaderboard",
        msg
    )} Refreshing list of top 10 active members.
${DOT} ${getChannel("self-roles", msg)} User selectable roles.
${DOT} ${getChannel("starboard", msg)} Starred messages appear here.
${DOT} ${getChannel(
        "suggestions",
        msg
    )} Suggest & Vote suggestions to improve the server.
${DOT} ${getChannel("qotw", msg)} **Q**uestion **O**f **T**he **W**eek.
### SUPPORT
Create a ticket in ${getChannel(
        "support",
        msg
    )} for queries / help & support / etc.
    `);

    const roles = EmbedBuilder.from(base).setImage(
        "https://cdn.discordapp.com/attachments/1036666970235490394/1140983448803233922/3.png"
    ).setDescription(stripIndents`
### MAIN
${DOT} ${getRole(
        "Lorenz",
        msg
    )} Technoking of Bangalore Hub aka <@838620835282812969>.
${DOT} ${getRole(
        "Owner",
        msg
    )} Owners - <@838620835282812969> & <@433180057675104257>.
${DOT} ${getRole("Staff", msg)} Responsible & respected Staff.
${DOT} ${getRole("Boost", msg)} Hoisted role for Discord Nitro server boosters.
${DOT} ${getRole(
        "Honoured",
        msg
    )} Hoisted role for other school server owners OR deserving members.
${DOT} ${getRole("Member", msg)} Members of the server.
${DOT} ${getRole("Bypass", msg)} Bypass automod restrictions.
### MISC
${DOT} Obtain more roles under ⁠⁠${getChannel("self-roles", msg)}.
${DOT} ${getRole(
        "Bypass",
        msg
    )} requires you to have \`750+\` [\`seven hundred and fifty or more\`] messages (</messages:960192961096871976>).
    `);

    const links = EmbedBuilder.from(base).setImage(
        "https://cdn.discordapp.com/attachments/1036666970235490394/1140983449038098432/4.png"
    ).setDescription(stripIndents`
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
    ${DOT} [Dyno.gg](https://dyno.gg/server/1023702510730494012/)`);

    const jumpToTop = (url: string) =>
        new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setURL(url)
                .setStyle(ButtonStyle.Link)
                .setLabel("Jump to top!")
        );
    const first = await (msg.channel as TextChannel).send({
        embeds: [about]
    });
    [info, roles, links].forEach(
        async (embed) => await (msg.channel as TextChannel).send({ embeds: [embed] })
    );
    await (msg.channel as TextChannel).send({
        components: [jumpToTop(first.url)]
    });

    return await msg.delete().catch(() => {});
};

const Roles = async (msg: Message) => {
    const base = new EmbedBuilder()
        .setColor("Blurple")
        .setImage(`https://singlecolorimage.com/get/5865f2/320x5`)
        .setThumbnail(msg.guild!.iconURL());
    const e1 = EmbedBuilder.from(base)
        .setTitle("Grade Roles")
        .setDescription(
            gradeRoles
                .map((r) => `${getEmoji(msg, r.emoji)}・<@&${r.role}>`)
                .join("\n")
        )
        .setFooter({
            text: "You can only select one role, open a ticket to change",
            iconURL:
                "https://www.iconsdb.com/icons/preview/color/5865F2/info-3-xxl.png"
        });

    const e2 = EmbedBuilder.from(base)
        .setTitle("Activity Roles")
        .setDescription(
            activtyRoles
                .map((r) => `${getEmoji(msg, r.emoji)}・<@&${r.role}>`)
                .join("\n")
        )
        .setFooter({
            text: "You can select multiple roles",
            iconURL:
                "https://www.iconsdb.com/icons/preview/color/5865F2/info-3-xxl.png"
        });

    const e3 = EmbedBuilder.from(base)
        .setTitle("School Roles")
        .setImage(`https://singlecolorimage.com/get/5865f2/369x5`)
        .setDescription(
            "Pick your school roles below! If your school role isn't shown, open a ticket in <#1031159883673911336>."
        );

    const b1 = gradeRoles.map((r) =>
        new ButtonBuilder()
            .setEmoji(r.emoji)
            .setLabel(" ")
            .setCustomId(`g-${r.role}`)
            .setStyle(ButtonStyle.Secondary)
    );
    const b12 = b1.pop();

    const b2 = activtyRoles.map((r) =>
        new ButtonBuilder()
            .setEmoji(r.emoji)
            .setLabel(" ")
            .setCustomId(`a-${r.role}`)
            .setStyle(ButtonStyle.Secondary)
    );

    const e4 = EmbedBuilder.from(base)
        .setTitle("Ping Roles")
        .setImage("https://singlecolorimage.com/get/5865f2/320x5")
        .setDescription(
            pingRoles.map((d) => `${d.emoji}・<@&${d.role}>`).join("\n")
        )
        .setFooter({
            text: "You can select multiple roles",
            iconURL:
                "https://www.iconsdb.com/icons/preview/color/5865F2/info-3-xxl.png"
        });
    const b3 = pingRoles.map((r) =>
        new ButtonBuilder()
            .setEmoji(r.emoji)
            .setLabel(" ")
            .setCustomId(`p-${r.role}`)
            .setStyle(ButtonStyle.Secondary)
    );

    const menu = new StringSelectMenuBuilder()
        .setPlaceholder("Select your school role..")
        .setCustomId("SCHOOL")
        .addOptions(
            schoolRoles.map((r) => {
                return {
                    label: `${getRoleName(msg, r)!}`,
                    value: r
                };
            })
        );

    await (msg.channel as TextChannel).send({
        embeds: [e1],
        components: [
            new ActionRowBuilder<ButtonBuilder>().setComponents(b1),
            new ActionRowBuilder<ButtonBuilder>().setComponents(b12!)
        ]
    });
    await (msg.channel as TextChannel).send({
        embeds: [e2],
        components: [new ActionRowBuilder<ButtonBuilder>().setComponents(b2)]
    });
    await (msg.channel as TextChannel).send({
        embeds: [e4],
        components: [new ActionRowBuilder<ButtonBuilder>().setComponents(b3)]
    });
    await (msg.channel as TextChannel).send({
        embeds: [e3],
        components: [
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(menu)
        ]
    });
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
