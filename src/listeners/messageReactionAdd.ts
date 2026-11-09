import type { MessageReaction, User } from "discord.js";
import { STAR, handleStar } from "../lib/starboard";

export default async function run(reaction: MessageReaction, _user?: User) {
    if (reaction.emoji.name !== STAR) return;
    if (reaction.partial) await reaction.fetch().catch(() => {});
    await handleStar(reaction).catch((error) => {
        console.error(error);
    });
}
