import { GuildMember } from "discord.js";
import { guildId, voiceCh } from "../config";

export default async function run(member: GuildMember) {
    const guild = member.client.guilds.cache.get(guildId);
    if (!guild) return;
    const channel = guild?.channels.cache.get(voiceCh);
    if (!channel) return;

    await channel
        .edit({ name: `Members・${guild.memberCount.toLocaleString()}` })
        .catch(() => {});
}
