import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message,
    StringSelectMenuBuilder
} from "discord.js";
import { Command } from "../../lib/command";
import { gradeRoles, activtyRoles, schoolRoles, pingRoles } from "../../config";

const roles: Command = {
    name: "roles",
    description: "No",
    ownerOnly: true,
    messageRun: async (msg) => {
        const base = new EmbedBuilder()
            .setColor("Blurple")
            .setImage(`https://singlecolorimage.com/get/5865f2/320x20`)
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
            .setImage("https://singlecolorimage.com/get/5865f2/320x20")
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

        await msg.channel.send({
            embeds: [e1],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(b1),
                new ActionRowBuilder<ButtonBuilder>().setComponents(b12!)
            ]
        });
        await msg.channel.send({
            embeds: [e2],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(b2)
            ]
        });
        await msg.channel.send({
            embeds: [e4],
            components: [
                new ActionRowBuilder<ButtonBuilder>().setComponents(b3)
            ]
        });
        await msg.channel.send({
            embeds: [e3],
            components: [
                new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                    menu
                )
            ]
        });
    }
};

export default roles;
const getEmoji = (msg: Message, id: string) => {
    if (id.length <= 3) return id;
    const e = msg.client.emojis.cache.get(id)!;
    return `<:${e.name}:${e.id}>`;
};
const getRoleName = (msg: Message, role: string) => {
    return msg.guild?.roles.cache.get(role)!.name;
};
