import { Command } from "../../lib/command";
import {
    Message,
    EmbedBuilder,
    resolveColor,
    ColorResolvable
} from "discord.js";
import { errorEmbed } from "../../lib/response";

const COLOUR_ROLE = "1084108737679212594";

const colour: Command = {
    name: "colour",
    aliases: ["color", "c"],
    description: "Preview a colour on the shared colour role",
    staffOnly: true,
    usage: "<hex> | <color>",
    examples: ["#ff0000", "Red"],
    messageRun: async (msg: Message, args?: string[]) => {
        const role = msg.guild!.roles.cache.get(COLOUR_ROLE);
        if (!role) {
            msg.reply({
                embeds: [
                    errorEmbed("The colour role is missing from this server.")
                ]
            });
            return;
        }

        if (!args![0]) {
            msg.reply({
                embeds: [errorEmbed("Please provide a valid HEX code.")]
            });
            return;
        }

        let color: number;
        try {
            color = resolveColor(args![0] as ColorResolvable);
        } catch {
            msg.reply({
                embeds: [
                    errorEmbed(
                        "That isn't a valid colour. Try a HEX code like `#5865f2`."
                    )
                ]
            });
            return;
        }

        const hex = color.toString(16).padStart(6, "0");

        await msg.guild?.roles.edit(role.id, { color });
        await msg.member?.roles.add(role, `Colour preview #${hex}`);
        msg.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`#${hex.toUpperCase()}`)
                    .setDescription(
                        `This role is removed <t:${Math.round(
                            (Date.now() + 30000) / 1000
                        )}:R>`
                    )
                    .setThumbnail(
                        `https://singlecolorimage.com/get/${hex}/200x200`
                    )
            ]
        });

        setTimeout(() => {
            msg.member?.roles.remove(role.id).catch(() => {});
        }, 30 * 1000);
    }
};

export default colour;
