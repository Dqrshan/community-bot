import { Message } from "discord.js";
import { Command } from "../../lib/command";
import {
    card,
    COLORS,
    divider,
    section,
    statusContainer,
    text,
    thumb,
    V2
} from "../../lib/components";
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
                components: [
                    statusContainer(
                        "info",
                        "You are already AFK. Send a message to clear your status."
                    )
                ],
                flags: V2
            });
        }

        let reason = args!.length ? args!.join(" ") : "AFK";
        if (reason.length > 500) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "The reason cannot exceed 500 characters."
                    )
                ],
                flags: V2
            });
        }
        reason = reason
            .replaceAll(/@everyone/g, "everyone")
            .replaceAll(/@here/g, "here")
            .replaceAll(/@&/g, "");

        const container = card(
            COLORS.info,
            section(
                [
                    `## ${msg.author.username} is now AFK`,
                    reason,
                    `-# <t:${Math.round(Date.now() / 1000)}:f>`
                ],
                thumb(
                    msg.author.displayAvatarURL({ size: 128 }),
                    msg.author.username
                )
            ),
            divider(),
            text("-# This clears automatically when you send a message")
        );

        msg.reply({ components: [container], flags: V2 });

        const name = msg.member?.displayName ?? msg.author.displayName;
        if (!name.startsWith("[AFK]"))
            msg.member!.setNickname(`[AFK] ${name}`).catch(() => {});

        await createAfk(guildId, msg.author.id, reason, Date.now());
    }
};

export default AFK;
