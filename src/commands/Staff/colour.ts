import { Command } from "../../lib/command";
import {
    Message,
    EmbedBuilder,
    resolveColor,
    ColorResolvable
} from "discord.js";

const colour: Command = {
    name: "colour",
    aliases: ["color", "c"],
    description: "Adds a custom role with given colour",
    staffOnly: true,
    usage: "<hex> | <color>",
    examples: ["#ff0000", "Red"],
    messageRun: async (msg: Message, args?: string[]) => {
        const role = msg.guild!.roles.cache.get("1084108737679212594");
        if (!role) {
            msg.reply({
                content: "Missing the colour role :("
            });
            return;
        }

        if (!args![0]) {
            msg.reply({
                content: "Input a valid HEX code!"
            });
            return;
        }

        await msg.guild?.roles.edit(role.id, {
            color: resolveColor(args![0] as ColorResolvable)
        });

        await msg.member?.roles.add(
            role,
            `Colour Test: '#${resolveColor(args![0] as ColorResolvable)
                .toString(16)
                .padStart(6, "0")}'`
        );
        msg.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(resolveColor(args![0] as ColorResolvable))
                    .setTitle(args![0])
                    .setDescription(
                        `⚠️ This role will be removed <t:${Math.round(
                            (Date.now() + 30000) / 1000
                        )}:R>`
                    )
                    .setThumbnail(
                        `https://singlecolorimage.com/get/${resolveColor(
                            args![0] as ColorResolvable
                        )
                            .toString(16)
                            .padStart(6, "0")}/200x200`
                    )
            ]
        });

        setTimeout(() => {
            msg.member?.roles.remove(role.id);
        }, 30 * 1000);
    }
};

export default colour;
