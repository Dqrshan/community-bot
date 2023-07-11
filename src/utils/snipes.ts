import { APIEmbed, Client, Collection } from "discord.js";

export default class Snipes {
    public static async load(client: Client) {
        const full = await client.prisma.snipes.findMany();
        for (const f of full) {
            snipes.set(f.channel, JSON.parse(f.data));
        }
        client.console.success(`Loaded ${snipes.size} snipes`);
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
        await client.prisma.snipes
            .upsert({
                create: {
                    channel,
                    data: JSON.stringify(raw),
                    timestamp: data.timestamp
                },
                update: {
                    channel,
                    data: JSON.stringify(raw),
                    timestamp: data.timestamp
                },
                where: {
                    channel
                }
            })
            .catch(console.error);
        return;
    }

    public static get(channel: string) {
        if (!channel) return null;

        return snipes.get(channel) ?? [];
    }
}

export const snipes = new Collection<string, snipeObject[]>();

export type snipeObject = {
    message: string;
    author: string;
    content: string;
    attachments: string[];
    embeds: APIEmbed[] | [];
    timestamp: number;
    reference: string | null;
};
