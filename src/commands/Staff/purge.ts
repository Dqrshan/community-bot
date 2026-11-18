import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { Command } from "../../lib/command";
import { statusContainer, V2 } from "../../lib/components";

const purge: Command = {
    name: "purge",
    description: "Bulk delete recent messages in this channel",
    staffOnly: true,
    usage: "<amount> [@user]",
    examples: ["20", "50 @user"],
    messageRun: async (msg: Message, args?: string[]) => {
        const channel = msg.channel as TextChannel;

        if (!msg.member!.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "You need the **Manage Messages** permission to do that."
                    )
                ],
                flags: V2
            });
        }

        const amount = parseInt(args?.[0] ?? "");
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return msg.reply({
                components: [
                    statusContainer(
                        "info",
                        "**Usage**\n`+purge <1-100> [@user]`"
                    )
                ],
                flags: V2
            });
        }

        const target = msg.mentions.users.first();

        const fetched = await channel.messages.fetch({ limit: 100 });
        const toDelete = [...fetched.values()]
            .filter((m) => !m.pinned)
            .filter((m) => !target || m.author.id === target.id)
            .slice(0, amount);

        if (!toDelete.length) {
            return msg.reply({
                components: [
                    statusContainer("info", "There were no messages to delete.")
                ],
                flags: V2
            });
        }

        const deleted = await channel
            .bulkDelete(toDelete, true)
            .catch(() => null);

        if (!deleted) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "I couldn't delete those messages. Messages older than 14 days can't be bulk deleted."
                    )
                ],
                flags: V2
            });
        }

        const sent = await msg.reply({
            components: [
                statusContainer(
                    "success",
                    `Deleted **${deleted.size}** message${
                        deleted.size === 1 ? "" : "s"
                    }${target ? ` from <@${target.id}>` : ""}.`
                )
            ],
            flags: V2,
            allowedMentions: { parse: [] }
        });

        setTimeout(() => sent.delete().catch(() => {}), 4000);
        return sent;
    }
};

export default purge;
