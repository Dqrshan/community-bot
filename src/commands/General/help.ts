import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    GuildMember,
    Message
} from "discord.js";
import { Command } from "../../lib/command";
import { DOT, errorEmbed } from "../../lib/response";
import { links, owners } from "../../config";

const CATEGORIES: Record<string, string> = {
    General: "Everyday commands for everyone",
    Utility: "Handy tools and server utilities",
    Staff: "Moderation tools for staff",
    Owner: "Restricted to the bot owners"
};

const help: Command = {
    name: "help",
    description: "Browse all available commands or get details on one",
    aliases: ["h", "commands", "cmds"],
    usage: "[commandName]",
    examples: ["ping", "avatar", " "],
    messageRun: async (msg: Message, args) => {
        const accent =
            msg.member &&
            (msg.member as GuildMember).displayHexColor !== "#000000"
                ? (msg.member as GuildMember).displayHexColor
                : "Blurple";

        if (args?.length) {
            const query = args[0].toLowerCase();
            const command =
                msg.client.commands.get(query) ||
                msg.client.commands.find(
                    (c) => c.aliases && c.aliases.includes(query)
                );
            if (!command || command.category === "Owner") {
                return msg.reply({
                    embeds: [
                        errorEmbed(
                            `I couldn't find a command called \`${query}\`.`
                        )
                    ]
                });
            }

            const embed = new EmbedBuilder()
                .setColor(accent)
                .setTitle(command.name)
                .setDescription(command.description ?? "No description")
                .addFields(
                    {
                        name: "Category",
                        value: command.category!,
                        inline: true
                    },
                    {
                        name: "Aliases",
                        value: command.aliases?.length
                            ? command.aliases
                                  .map((a) => `\`${a}\``)
                                  .join(` ${DOT} `)
                            : "None",
                        inline: true
                    },
                    {
                        name: "Usage",
                        value: `\`${msg.client.prefix}${command.name} ${command.usage ?? ""}\``,
                        inline: false
                    }
                )
                .setFooter({
                    text: `[] optional ${DOT} <> required`
                });

            if (command.examples?.length) {
                embed.addFields({
                    name: "Examples",
                    value: command.examples
                        .map(
                            (ex) =>
                                `\`${msg.client.prefix}${command.name} ${ex.trim()}\``
                        )
                        .join("\n")
                });
            }

            await msg.reply({ embeds: [embed] }).catch(() => {});
            return;
        }

        const isOwner = owners.includes(msg.author.id);
        const cats = [
            ...new Set(
                msg.client.commands
                    .filter((c) => isOwner || c.category !== "Owner")
                    .map((c) => c.category!)
            )
        ];

        const embed = new EmbedBuilder()
            .setColor(accent)
            .setAuthor({
                name: `${msg.client.user?.username} Command List`,
                iconURL: msg.client.user?.displayAvatarURL()
            })
            .setDescription(
                `Use \`${msg.client.prefix}help <command>\` for details on a specific command.`
            )
            .addFields(
                cats.map((dir) => {
                    const commands = msg.client.commands.filter(
                        (c) => c.category === dir
                    );
                    return {
                        name: `${dir} ${DOT} ${commands.size}`,
                        value: `${CATEGORIES[dir] ?? ""}\n${commands
                            .map((x) => `\`${x.name}\``)
                            .join(` ${DOT} `)}`,
                        inline: false
                    };
                })
            )
            .setFooter({
                text: `${msg.client.commands.size} commands ${DOT} ${msg.client.prefix}help`,
                iconURL: msg.client.user?.displayAvatarURL()
            });

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setLabel("Website")
                .setStyle(ButtonStyle.Link)
                .setURL(links.website),
            new ButtonBuilder()
                .setLabel("Vote")
                .setStyle(ButtonStyle.Link)
                .setURL(links.topgg)
        );

        await msg.reply({ embeds: [embed], components: [row] }).catch(() => {});
    }
};

export default help;
