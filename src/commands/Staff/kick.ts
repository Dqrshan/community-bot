import { Message, PermissionFlagsBits } from "discord.js";
import { Command } from "../../lib/command";
import { replyError, replySuccess } from "../../lib/response";

const kick: Command = {
    name: "kick",
    description: "Kick a member from the server (staff only)",
    staffOnly: true,
    usage: "<member> <reason>",
    examples: ["@user spamming", "@user repeated warnings"],
    messageRun: async (msg: Message, args?: string[]) => {
        if (!msg.member!.permissions.has(PermissionFlagsBits.KickMembers)) {
            return replyError(
                msg,
                "You need the **Kick Members** permission to use this command."
            );
        }

        const targetId =
            msg.mentions.members?.first()?.id ??
            args?.[0]?.replace(/[<@!>]/g, "");
        const target = targetId
            ? msg.guild!.members.resolve(targetId)
            : null;

        if (!target) {
            return replyError(
                msg,
                `Please mention a member to kick.\nUsage: \`${msg.client.prefix}kick <member> <reason>\``
            );
        }

        if (target.id === msg.author.id) {
            return replyError(msg, "You can't kick yourself.");
        }

        if (
            msg.member!.roles.highest.position <=
            target.roles.highest.position
        ) {
            return replyError(
                msg,
                "You can't kick a member with a role equal to or higher than yours."
            );
        }

        if (!target.kickable) {
            return replyError(
                msg,
                "I can't kick that member. They may have a higher role than me."
            );
        }

        const reason = args?.slice(1).join(" ").trim();
        if (!reason) {
            return replyError(
                msg,
                `Please provide a reason.\nUsage: \`${msg.client.prefix}kick <member> <reason>\``
            );
        }

        await target.kick(
            `Kicked by ${msg.author.tag} (${msg.author.id}) | ${reason}`
        );

        return replySuccess(
            msg,
            `${target.user.tag} has been kicked.\nReason: ${reason}`
        );
    }
};

export default kick;
