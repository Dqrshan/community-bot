import type { APIEmbed, Client } from "discord.js";
import { allSnipes, writeSnipes } from "./db";

export default class Snipes {
    public static async load() {
        const stored = await allSnipes();
        for (const row of stored) {
            snipes.set(row.channel, JSON.parse(row.data));
        }
        return snipes.size;
    }
    public static async set(
        client: Client,
        channel: string,
        data: snipeObject
    ) {
        if (!channel) return null;
        const raw = snipes.get(channel) ?? [];
        raw.unshift({
            message: data.message,
            content: data.content,
            author: data.author,
            attachments: data.attachments,
            embeds: data.embeds,
            timestamp: data.timestamp,
            reference: data.reference
        });

        snipes.set(channel, raw);
        await writeSnipes(channel, JSON.stringify(raw), data.timestamp).catch(
            (error) => client.console.error(error)
        );
        return;
    }

    public static get(channel: string) {
        if (!channel) return null;

        return snipes.get(channel) ?? [];
    }
}

export const snipes = new Map<string, snipeObject[]>();

export type snipeObject = {
    message: string;
    author: string;
    content: string;
    attachments: string[];
    embeds: APIEmbed[] | [];
    timestamp: number;
    reference: string | null;
};
