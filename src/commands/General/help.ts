import { GuildMember, Message } from "discord.js";
import { Command } from "../../lib/command";
import {
    actionRow,
    add,
    card,
    COLORS,
    divider,
    linkButton,
    section,
    statusContainer,
    text,
    thumb,
    V2
} from "../../lib/components";
import { DOT } from "../../lib/response";
import { emoji } from "../../lib/emojis";
import { links, owners } from "../../config";

const CATEGORIES: Record<string, string> = {
    General: "Everyday commands for everyone",
    Utility: "Handy tools and server utilities",
    Staff: "Moderation tools for staff",
    Owner: "Restricted to the bot owners"
};

const CATEGORY_EMOJI: Record<string, "info" | "link" | "staff" | "trophy"> = {
    General: "info",
    Utility: "link",
    Staff: "staff",
    Owner: "trophy"
};

const help: Command = {
    name: "help",
    description: "Browse all available commands or get details on one",
    aliases: ["h", "commands", "cmds"],
    usage: "[commandName]",
    examples: ["ping", "avatar", " "],
    messageRun: async (msg: Message, args) => {
        const accentHex =
            msg.member &&
            (msg.member as GuildMember).displayHexColor !== "#000000"
                ? parseInt(
                      (msg.member as GuildMember).displayHexColor.slice(1),
                      16
                  )
                : COLORS.info;

        const bot = msg.client.user!;

        if (args?.length) {
            const query = args[0].toLowerCase();
            const command =
                msg.client.commands.get(query) ||
                msg.client.commands.find(
                    (c) => c.aliases && c.aliases.includes(query)
                );
            if (!command || command.category === "Owner") {
                return msg.reply({
                    components: [
                        statusContainer(
                            "error",
                            `I couldn't find a command called \`${query}\`.`
                        )
                    ],
                    flags: V2
                });
            }

            const container = card(
                accentHex,
                section(
                    [
                        `# ${command.name}`,
                        command.description ?? "No description",
                        `-# ${command.category}`
                    ],
                    thumb(bot.displayAvatarURL({ size: 128 }), "Bot avatar")
                ),
                divider(),
                text(
                    `**Aliases** ${DOT} ${
                        command.aliases?.length
                            ? command.aliases
                                  .map((a) => `\`${a}\``)
                                  .join(` ${DOT} `)
                            : "None"
                    }\n**Usage** ${DOT} \`${msg.client.prefix}${
                        command.name
                    } ${command.usage ?? ""}\``
                )
            );

            if (command.examples?.length) {
                container.addTextDisplayComponents(
                    text(
                        `**Examples**\n${command.examples
                            .map(
                                (ex) =>
                                    `\`${msg.client.prefix}${command.name} ${ex.trim()}\``
                            )
                            .join("\n")}`
                    )
                );
            }

            add(
                container,
                divider(),
                text(`-# [] optional ${DOT} <> required`),
                actionRow(
                    linkButton("Website", links.website),
                    linkButton("Vote", links.topgg)
                )
            );

            await msg.reply({ components: [container], flags: V2 }).catch(() => {});
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

        const container = card(
            accentHex,
            section(
                [
                    `# ${bot.username} Command List`,
                    `Use \`${msg.client.prefix}help <command>\` for details on a specific command.`,
                    `-# ${msg.client.commands.size} commands`
                ],
                thumb(bot.displayAvatarURL({ size: 128 }), "Bot avatar")
            ),
            divider()
        );

        cats.forEach((dir, index) => {
            const commands = msg.client.commands.filter(
                (c) => c.category === dir
            );
            // The header already ends in a separator; skip a second one.
            if (index > 0) add(container, divider());
            add(
                container,
                text(
                    `### ${emoji(CATEGORY_EMOJI[dir] ?? "info")} ${dir} ${DOT} ${commands.size}\n${
                        CATEGORIES[dir] ?? ""
                    }\n${commands.map((x) => `\`${x.name}\``).join(` ${DOT} `)}`
                )
            );
        });

        add(
            container,
            divider(),
            text(`-# ${msg.client.prefix}help <command> for more`),
            actionRow(
                linkButton("Website", links.website),
                linkButton("Vote", links.topgg)
            )
        );

        await msg.reply({ components: [container], flags: V2 }).catch(() => {});
    }
};

export default help;
