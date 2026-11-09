import { EmbedBuilder, Message } from "discord.js";
import { Command } from "../../lib/command";
import { errorEmbed, infoEmbed } from "../../lib/response";
import { createAfk, findAfk } from "../../lib/db";

const AFK: Command = {
    name: "afk",
    description: "Set an AFK status so people know you're away",
    examples: ["sleeping", "studying", " "],
    usage: "[reason]",
    messageRun: async (msg: Message, args?: string[]) => {
        const guildId = msg.guildId!;
        const data = await findAfk(guildId, msg.author.id);

        if (data) {
            return msg.reply({
                embeds: [
                    infoEmbed(
                        "You are already AFK. Send a message to clear your status."
                    )
                ]
            });
        }

        let reason = args!.length ? args!.join(" ") : "AFK";
        if (reason.length > 500) {
            return msg.reply({
                embeds: [
                    errorEmbed("The reason cannot exceed 500 characters.")
                ]
            });
        }
        reason = reason
            .replaceAll(/@everyone/g, "everyone")
            .replaceAll(/@here/g, "here")
            .replaceAll(/@&/g, "");

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setAuthor({
                name: `${msg.author.username} is now AFK`,
                iconURL: msg.author.displayAvatarURL()
            })
            .setDescription(reason)
            .setFooter({
                text: "This clears automatically when you send a message"
            })
            .setTimestamp();

        msg.reply({ embeds: [embed] });

        const name = msg.member?.displayName ?? msg.author.displayName;
        if (!name.startsWith("[AFK]"))
            msg.member!.setNickname(`[AFK] ${name}`).catch(() => {});

        await createAfk(guildId, msg.author.id, reason, Date.now());
    }
};

export default AFK;
