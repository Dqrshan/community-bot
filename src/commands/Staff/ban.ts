import { Message, PermissionFlagsBits } from "discord.js";
import { Command } from "../../lib/command";
import { replyError, replySuccess } from "../../lib/response";

const ban: Command = {
    name: "ban",
    description: "Ban a member from the server (staff only)",
    staffOnly: true,
    usage: "<member> <reason>",
    examples: ["@user raids", "@user severe rule violation"],
    messageRun: async (msg: Message, args?: string[]) => {
        if (!msg.member!.permissions.has(PermissionFlagsBits.BanMembers)) {
            return replyError(
                msg,
                "You need the **Ban Members** permission to use this command."
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
                `Please mention a member to ban.\nUsage: \`${msg.client.prefix}ban <member> <reason>\``
            );
        }

        if (target.id === msg.author.id) {
            return replyError(msg, "You can't ban yourself.");
        }

        if (
            msg.member!.roles.highest.position <=
            target.roles.highest.position
        ) {
            return replyError(
                msg,
                "You can't ban a member with a role equal to or higher than yours."
            );
        }

        if (!target.bannable) {
            return replyError(
                msg,
                "I can't ban that member. They may have a higher role than me."
            );
        }

        const reason = args?.slice(1).join(" ").trim();
        if (!reason) {
            return replyError(
                msg,
                `Please provide a reason.\nUsage: \`${msg.client.prefix}ban <member> <reason>\``
            );
        }

        await target.ban({
            reason: `Banned by ${msg.author.tag} (${msg.author.id}) | ${reason}`,
            deleteMessageSeconds: 0
        });

        return replySuccess(
            msg,
            `${target.user.tag} has been banned.\nReason: ${reason}`
        );
    }
};

export default ban;
