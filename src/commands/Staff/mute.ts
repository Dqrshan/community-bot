import { Message, PermissionFlagsBits } from "discord.js";
import { Command } from "../../lib/command";
import { replyError, replySuccess } from "../../lib/response";

const MUTED_ROLE = "1034807492900818954";

const mute: Command = {
    name: "mute",
    description: "Assign the muted role to a member (staff only)",
    staffOnly: true,
    usage: "<member> <reason>",
    examples: ["@user spamming", "@user repeated warnings"],
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
                `Please mention a member to mute.\nUsage: \`${msg.client.prefix}mute <member> <reason>\``
            );
        }

        if (target.id === msg.author.id) {
            return replyError(msg, "You can't mute yourself.");
        }

        if (
            msg.member!.roles.highest.position <=
            target.roles.highest.position
        ) {
            return replyError(
                msg,
                "You can't mute a member with a role equal to or higher than yours."
            );
        }

        if (!target.manageable) {
            return replyError(
                msg,
                "I can't manage that member's roles. Check my permissions and role hierarchy."
            );
        }

        const role = msg.guild!.roles.cache.get(MUTED_ROLE);
        if (!role) {
            return replyError(
                msg,
                "The muted role couldn't be found. Please check the configuration."
            );
        }

        if (target.roles.cache.has(role.id)) {
            return replyError(msg, `${target.user.tag} is already muted.`);
        }

        const reason = args?.slice(1).join(" ").trim();
        if (!reason) {
            return replyError(
                msg,
                `Please provide a reason.\nUsage: \`${msg.client.prefix}mute <member> <reason>\``
            );
        }

        await target.roles.add(
            role,
            `Muted by ${msg.author.tag} (${msg.author.id}) | ${reason}`
        );

        return replySuccess(
            msg,
            `${target.user.tag} has been muted.\nReason: ${reason}`
        );
    }
};

export default mute;
