import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import ms from "ms";
import { Command } from "../../lib/command";
import { statusContainer, V2 } from "../../lib/components";

const MAX_SECONDS = 6 * 60 * 60;

const slowmode: Command = {
    name: "slowmode",
    description: "Set the channel slowmode interval",
    staffOnly: true,
    aliases: ["slow"],
    usage: "<duration|off>",
    examples: ["10s", "1m", "off"],
    messageRun: async (msg: Message, args?: string[]) => {
        const channel = msg.channel as TextChannel;

        if (!msg.member!.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "You need the **Manage Channels** permission to do that."
                    )
                ],
                flags: V2
            });
        }

        const input = args?.[0]?.toLowerCase();
        if (!input) {
            return msg.reply({
                components: [
                    statusContainer(
                        "info",
                        "**Usage**\n`+slowmode <duration|off>`\n-# Examples: `10s`, `1m`, `off`"
                    )
                ],
                flags: V2
            });
        }

        if (input === "off" || input === "0") {
            await channel.setRateLimitPerUser(0, `Slowmode disabled by ${msg.author.tag}`);
            return msg.reply({
                components: [
                    statusContainer("success", "Slowmode is now **off**.")
                ],
                flags: V2
            });
        }

        // A bare number is read as seconds, e.g. `+slowmode 10`.
        const seconds = /^\d+$/.test(input)
            ? parseInt(input)
            : Math.round(ms(input as ms.StringValue) / 1000);

        if (isNaN(seconds) || seconds < 1 || seconds > MAX_SECONDS) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "Pick a duration between **1 second** and **6 hours**, or `off`."
                    )
                ],
                flags: V2
            });
        }

        await channel.setRateLimitPerUser(
            seconds,
            `Slowmode set by ${msg.author.tag}`
        );

        return msg.reply({
            components: [
                statusContainer(
                    "success",
                    `Slowmode set to **${ms(seconds * 1000, { long: true })}**.`
                )
            ],
            flags: V2
        });
    }
};

export default slowmode;
