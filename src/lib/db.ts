import type { Client, InValue, ResultSet } from "@libsql/client" with {
    "resolution-mode": "require"
};

const url =
    process.env.TURSO_DATABASE_URL || "file:database.sqlite";
const authToken = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;

export const getClient = async (): Promise<Client> => {
    if (client) return client;
    const { createClient } = await import("@libsql/client");
    client = createClient({ url, authToken });
    return client;
};

export type AfkRow = {
    user: string;
    guild: string;
    reason: string | null;
    timestamp: number;
};

export type MentionRow = {
    user: string;
    guild: string;
    mentions: string;
};

export type SnipeRow = {
    channel: string;
    data: string;
    timestamp: number;
};

export type SettingsRow = {
    guild: string;
    ticketCount: number;
};

export const ensureSchema = async () => {
    const db = await getClient();
    await db.execute(`
        CREATE TABLE IF NOT EXISTS afk_data (
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            reason TEXT DEFAULT 'AFK',
            timestamp INTEGER NOT NULL,
            PRIMARY KEY (guild, user)
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS mention_data (
            user TEXT NOT NULL,
            guild TEXT NOT NULL,
            mentions TEXT NOT NULL,
            PRIMARY KEY (guild, user)
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS snipes_data (
            channel TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS settings_data (
            guild TEXT PRIMARY KEY,
            ticketCount INTEGER NOT NULL DEFAULT 0
        )
    `);
};

const rows = <T>(rs: ResultSet): T[] => rs.rows as unknown as T[];

export const findAfk = async (guild: string, user: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT * FROM afk_data WHERE guild = ? AND user = ?",
        args: [guild, user]
    });
    return rows<AfkRow>(rs)[0] ?? null;
};

export const createAfk = (
    guild: string,
    user: string,
    reason: string,
    timestamp: number
) =>
    getClient().then((db) =>
        db.execute({
            sql: "INSERT INTO afk_data (user, guild, reason, timestamp) VALUES (?, ?, ?, ?)",
            args: [user, guild, reason, timestamp]
        })
    );

export const deleteAfk = (guild: string, user: string) =>
    getClient().then((db) =>
        db.execute({
            sql: "DELETE FROM afk_data WHERE guild = ? AND user = ?",
            args: [guild, user]
        })
    );

export const findMentions = async (guild: string, user: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT * FROM mention_data WHERE guild = ? AND user = ?",
        args: [guild, user]
    });
    return rows<MentionRow>(rs)[0] ?? null;
};

export const setMentions = (guild: string, user: string, mentions: string) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO mention_data (user, guild, mentions) VALUES (?, ?, ?)
                  ON CONFLICT (guild, user) DO UPDATE SET mentions = excluded.mentions`,
            args: [user, guild, mentions]
        })
    );

export const deleteMentions = (guild: string, user: string) =>
    getClient().then((db) =>
        db.execute({
            sql: "DELETE FROM mention_data WHERE guild = ? AND user = ?",
            args: [guild, user]
        })
    );

export const allSnipes = async () => {
    const db = await getClient();
    return rows<SnipeRow>(await db.execute("SELECT * FROM snipes_data"));
};

export const writeSnipes = (
    channel: string,
    data: string,
    timestamp: number
) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO snipes_data (channel, data, timestamp) VALUES (?, ?, ?)
                  ON CONFLICT (channel) DO UPDATE SET
                      data = excluded.data,
                      timestamp = excluded.timestamp`,
            args: [channel, data, timestamp]
        })
    );

export const ticketCount = async (guild: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT ticketCount FROM settings_data WHERE guild = ?",
        args: [guild]
    });
    return Number(rows<SettingsRow>(rs)[0]?.ticketCount ?? 0);
};

export const setTicketCount = (guild: string, count: number) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO settings_data (guild, ticketCount) VALUES (?, ?)
                  ON CONFLICT (guild) DO UPDATE SET ticketCount = excluded.ticketCount`,
            args: [guild, count]
        })
    );

export type { Client, InValue };
