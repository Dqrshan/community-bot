import { EmbedBuilder, GuildMember, Message } from "discord.js";
import { Command } from "../../lib/command";
import { owners } from "../../config";

const help: Command = {
    name: "help",
    description: "All supported & available commands",
    aliases: ["h"],
    usage: "[commandName]",
    examples: ["ping", " "],
    messageRun: async (msg: Message, args) => {
        if (args?.length) {
            const command =
                msg.client.commands.get(args[0].toLowerCase()) ||
                msg.client.commands.find(
                    (c) =>
                        c.aliases && c.aliases.includes(args[0].toLowerCase())
                );
            if (!command) return;
            const embed = new EmbedBuilder()
                .setTitle(
                    `Help: ${command.name}${
                        command.category === "Owner" ? " 🔒️" : ""
                    }`
                )
                .setDescription(command.description ?? "No description")
                .setColor("Blurple");
            if (command.aliases?.length) {
                embed.addFields({
                    name: "Aliases",
                    value: command.aliases.join(", "),
                    inline: true
                });
            }
            if (command.staffOnly) {
                embed.addFields({
                    name: "Staff Only",
                    value: "Yes",
                    inline: true
                });
            }
            if (command.usage) {
                embed
                    .addFields({
                        name: "Usage",
                        value: `\`${msg.client.prefix}${command.name} ${command.usage}\``,
                        inline: true
                    })
                    .setFooter({
                        text: `[]: Optional, <>: Required, | denotes 'OR'`,
                        iconURL: (msg.member as GuildMember).displayAvatarURL()
                    });
            }
            if (command.examples?.length) {
                embed.addFields({
                    name: "Examples",
                    value: command.examples
                        .map(
                            (ex) => `${msg.client.prefix}${command.name} ${ex}`
                        )
                        .join("\n"),
                    inline: false
                });
            }
            await msg.reply({ embeds: [embed] }).catch(() => {});
            return;
        }
        let dirs: string[];
        if (owners.includes(msg.author.id)) {
            dirs = [
                // @ts-ignore
                ...new Set(msg.client.commands.map((e) => e.category!))
            ];
        } else {
            dirs = [
                ...new Set(
                    msg.client.commands
                        .filter((e) => e.category !== "Owner")
                        .map((e) => e.category!)
                )
            ];
        }
        const cats = dirs.map((dir) => {
            const commands = msg.client.commands.filter(
                (c) => c.category === dir
            );
            return {
                dir,
                commands
            };
        });

        const embed = new EmbedBuilder()
            .setTitle(`Help`)
            .addFields(
                cats.map((c) => {
                    return {
                        name: `${c.dir} (${c.commands.size})`,
                        value: `${c.commands
                            .map((x) => `${x.name}`)
                            .join(", ")}`,
                        inline: false
                    };
                })
            )
            .setColor("Blurple");

        await msg.reply({ embeds: [embed] }).catch(() => {});
    }
};

export default help;
