import { Message, PermissionFlagsBits } from "discord.js";
import { Command } from "../../lib/command";
import { replyError, replySuccess } from "../../lib/response";

const MUTED_ROLE = "1034807492900818954";

const untimeout: Command = {
    name: "untimeout",
    description: "Remove a member's timeout and muted role (staff only)",
    staffOnly: true,
    usage: "<member> [reason]",
    examples: ["@user served time", "@user appealed"],
    messageRun: async (msg: Message, args?: string[]) => {
        if (
            !msg.member!.permissions.has(PermissionFlagsBits.ModerateMembers)
        ) {
            return replyError(
                msg,
                "You need the **Moderate Members** permission to use this command."
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
                `Please mention a member to untimeout.\nUsage: \`${msg.client.prefix}untimeout <member> [reason]\``
            );
        }

        if (target.id === msg.author.id) {
            return replyError(msg, "You can't untimeout yourself.");
        }

        if (
            msg.member!.roles.highest.position <=
            target.roles.highest.position
        ) {
            return replyError(
                msg,
                "You can't untimeout a member with a role equal to or higher than yours."
            );
        }

        if (!target.moderatable) {
            return replyError(
                msg,
                "I can't untimeout that member. They may have a higher role than me."
            );
        }

        const reason = args?.slice(1).join(" ").trim() || "No reason provided";

        await target.timeout(
            null,
            `Untimed out by ${msg.author.tag} (${msg.author.id}) | ${reason}`
        );

        const mutedRole = msg.guild!.roles.cache.get(MUTED_ROLE);
        if (mutedRole && target.roles.cache.has(mutedRole.id)) {
            await target.roles
                .remove(mutedRole, `Untimed out by ${msg.author.tag}`)
                .catch(() => {});
        }

        return replySuccess(
            msg,
            `${target.user.tag}'s timeout has been removed.\nReason: ${reason}`
        );
    }
};

export default untimeout;
