import type { Message } from "discord.js";
import { Command } from "../../lib/command";

const AFK: Command = {
    name: "afk",
    description: "Sets your AFK status",
    examples: ["sleeping", "studying", " "],
    usage: "[reason]",
    messageRun: async (msg: Message, args?: string[]) => {
        const data = await msg.client.prisma.afk.findUnique({
            where: {
                guild_user: {
                    user: msg.author.id,
                    guild: msg.guildId!
                }
            }
        });

        if (!data) {
            let reason = args!.length ? args!.join(" ") : "AFK";
            if (reason.length > 500) {
                msg.reply({ content: "Reason cannot exceed `500` chars" });
                return;
            }
            reason = reason
                .replaceAll(/@everyone/g, "everyone")
                .replaceAll(/@here/g, "here")
                .replaceAll(/@&/g, "");
            msg.reply({ content: `You are now AFK. Reason: ${reason}` });
            const name = msg.member?.nickname
                ? msg.member.nickname
                : msg.member?.displayName
                ? msg.member.displayName
                : msg.author.displayName;
            if (!name.startsWith("[AFK]"))
                msg.member!.setNickname(`[AFK] ${name}`).catch(() => {});

            await msg.client.prisma.afk.create({
                data: {
                    user: msg.author.id,
                    guild: msg.guildId!,
                    reason,
                    timestamp: Date.now()
                }
            });
        } else {
            msg.reply("You are already AFK!");
        }
    }
};

export default AFK;
