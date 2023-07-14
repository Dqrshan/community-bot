import { GuildMember } from "discord.js";
import { guildId, voiceCh } from "../config";
import { tickets } from "../lib/Ticket";

export default async function run(member: GuildMember) {
    if (tickets.get(member.user.id)) {
        const ticket = tickets.get(member.user.id)!;
        await ticket.delete(member.guild.members.me!, "User left the server");
        return;
    }
    const guild = member.client.guilds.cache.get(guildId);
    if (!guild) return;
    const channel = guild?.channels.cache.get(voiceCh);
    if (!channel) return;

    await channel
        .edit({ name: `Members・${guild.memberCount.toLocaleString()}` })
        .catch(() => {});
}
