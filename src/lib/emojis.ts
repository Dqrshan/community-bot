import type { Client } from "discord.js";

/**
 * Names of the application emojis uploaded from assets/emojis/generated.
 * Keep this list in sync with generated/manifest.json.
 */
const NAMES = [
    "tick",
    "cross",
    "warn",
    "info",
    "staff",
    "ticket",
    "idea",
    "upvote",
    "downvote",
    "star",
    "pin",
    "clock",
    "link",
    "announce",
    "boost",
    "gift",
    "event",
    "welcome",
    "rules",
    "trophy"
] as const;

export type EmojiName = (typeof NAMES)[number];

/** Used until the application emojis are loaded, or if one is missing. */
const FALLBACK: Record<EmojiName, string> = {
    tick: "✅",
    cross: "❌",
    warn: "⚠️",
    info: "ℹ️",
    staff: "🛡️",
    ticket: "🎫",
    idea: "💡",
    upvote: "👍",
    downvote: "👎",
    star: "⭐",
    pin: "📌",
    clock: "⏱️",
    link: "🔗",
    announce: "📣",
    boost: "💎",
    gift: "🎁",
    event: "📅",
    welcome: "👋",
    rules: "📜",
    trophy: "🏆"
};

const cache = new Map<EmojiName, { id: string; name: string }>();

/** Fetches the bot's application emojis and caches the ones we use. */
export const loadEmojis = async (client: Client) => {
    try {
        const emojis = await client.application?.emojis.fetch();
        if (!emojis) return 0;

        cache.clear();
        for (const emoji of emojis.values()) {
            if ((NAMES as readonly string[]).includes(emoji.name)) {
                cache.set(emoji.name as EmojiName, {
                    id: emoji.id,
                    name: emoji.name
                });
            }
        }
        return cache.size;
    } catch {
        return 0;
    }
};

/** Custom emoji mention when available, otherwise a unicode fallback. */
export const emoji = (name: EmojiName) => {
    const loaded = cache.get(name);
    return loaded ? `<:${loaded.name}:${loaded.id}>` : FALLBACK[name];
};

/** The uploaded emoji's id, or null when it isn't available. */
export const emojiId = (name: EmojiName) => cache.get(name)?.id ?? null;
