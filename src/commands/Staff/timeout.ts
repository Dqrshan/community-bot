import { Message, PermissionFlagsBits } from "discord.js";
import ms from "ms";
import { Command } from "../../lib/command";
import { replyError, replySuccess } from "../../lib/response";

const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000;

const timeout: Command = {
    name: "timeout",
    description: "Timeout a member for a specified duration (staff only)",
    staffOnly: true,
    usage: "<member> <duration>",
    examples: ["@user 10m", "@user 1h 30m", "@user 7d"],
    messageRun: async (msg: Message, args?: string[]) => {
        if (
            !msg.member!.permissions.has(
                PermissionFlagsBits.ModerateMembers
            )
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
                `Please mention a member to timeout.\nUsage: \`${msg.client.prefix}timeout <member> <duration>\``
            );
        }

        if (target.id === msg.author.id) {
            return replyError(msg, "You can't timeout yourself.");
        }

        if (!target.moderatable) {
            return replyError(
                msg,
                "I can't timeout that member. They may have a higher role than me."
            );
        }

        const durationArg = args?.slice(1).join(" ").trim();
        if (!durationArg) {
            return replyError(
                msg,
                `Please provide a duration.\nUsage: \`${msg.client.prefix}timeout <member> <duration>\``
            );
        }

        const duration = ms(durationArg as ms.StringValue);
        if (typeof duration !== "number" || duration <= 0) {
            return replyError(
                msg,
                "That doesn't look like a valid duration. Try something like `10m`, `1h`, or `7d`."
            );
        }

        if (duration > MAX_TIMEOUT) {
            return replyError(
                msg,
                "Discord timeouts can't be longer than 28 days."
            );
        }

        await target.timeout(
            duration,
            `Timed out by ${msg.author.tag} (${msg.author.id})`
        );

        return replySuccess(
            msg,
            `${target.user.tag} has been timed out for ${ms(duration, {
                long: true
            })}.`
        );
    }
};

export default timeout;
