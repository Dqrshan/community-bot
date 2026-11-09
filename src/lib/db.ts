import type { Client, InValue, ResultSet } from "@libsql/client" with {
    "resolution-mode": "require"
};

let client: Client | null = null;

const resolveConfig = () => ({
    url: process.env.TURSO_DATABASE_URL || "file:database.sqlite",
    authToken: process.env.TURSO_AUTH_TOKEN
});

export const getClient = async (): Promise<Client> => {
    if (client) return client;
    const { createClient } = await import("@libsql/client");
    client = createClient(resolveConfig());
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

export type SuggestionRow = {
    guild: string;
    id: number;
    user: string;
    content: string;
    message: string | null;
    status: "pending" | "accepted" | "denied";
    reason: string | null;
    staff: string | null;
    timestamp: number;
};

export type StarRow = {
    message: string;
    guild: string;
    channel: string;
    author: string;
    content: string;
    stars: number;
    board: string | null;
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
    await db.execute(`
        CREATE TABLE IF NOT EXISTS suggestions_data (
            guild TEXT NOT NULL,
            id INTEGER NOT NULL,
            user TEXT NOT NULL,
            content TEXT NOT NULL,
            message TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            reason TEXT,
            staff TEXT,
            timestamp INTEGER NOT NULL,
            PRIMARY KEY (guild, id)
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS suggestion_votes (
            guild TEXT NOT NULL,
            id INTEGER NOT NULL,
            user TEXT NOT NULL,
            vote INTEGER NOT NULL,
            PRIMARY KEY (guild, id, user)
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS stars_data (
            message TEXT PRIMARY KEY,
            guild TEXT NOT NULL,
            channel TEXT NOT NULL,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            stars INTEGER NOT NULL DEFAULT 0,
            board TEXT
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS ai_context_data (
            guild TEXT NOT NULL,
            user TEXT NOT NULL,
            messages TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            PRIMARY KEY (guild, user)
        )
    `);
};

export const rows = <T>(rs: ResultSet): T[] =>
    rs.rows as unknown as T[];

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

export const nextSuggestionId = async (guild: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT MAX(id) AS maxId FROM suggestions_data WHERE guild = ?",
        args: [guild]
    });
    return Number(rows<{ maxId: number | null }>(rs)[0]?.maxId ?? 0) + 1;
};

export const findSuggestion = async (guild: string, id: number) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT * FROM suggestions_data WHERE guild = ? AND id = ?",
        args: [guild, id]
    });
    return rows<SuggestionRow>(rs)[0] ?? null;
};

export const insertSuggestion = (
    guild: string,
    id: number,
    user: string,
    content: string,
    timestamp: number
) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO suggestions_data (guild, id, user, content, timestamp)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [guild, id, user, content, timestamp]
        })
    );

export const setSuggestionMessage = (
    guild: string,
    id: number,
    message: string
) =>
    getClient().then((db) =>
        db.execute({
            sql: "UPDATE suggestions_data SET message = ? WHERE guild = ? AND id = ?",
            args: [message, guild, id]
        })
    );

export const resolveSuggestion = (
    guild: string,
    id: number,
    status: "accepted" | "denied",
    reason: string | null,
    staff: string
) =>
    getClient().then((db) =>
        db.execute({
            sql: `UPDATE suggestions_data SET status = ?, reason = ?, staff = ?
                  WHERE guild = ? AND id = ?`,
            args: [status, reason, staff, guild, id]
        })
    );

export const allSuggestions = async (guild: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT * FROM suggestions_data WHERE guild = ? AND status = 'pending' ORDER BY id DESC",
        args: [guild]
    });
    return rows<SuggestionRow>(rs);
};

export const findStar = async (message: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT * FROM stars_data WHERE message = ?",
        args: [message]
    });
    return rows<StarRow>(rs)[0] ?? null;
};

export const allStars = async () => {
    const db = await getClient();
    const rs = await db.execute(
        "SELECT * FROM stars_data ORDER BY stars DESC LIMIT 1000"
    );
    return rows<StarRow>(rs);
};

export const writeStar = (row: Omit<StarRow, "board"> & { board?: string | null }) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO stars_data (message, guild, channel, author, content, stars, board)
                  VALUES (?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT (message) DO UPDATE SET
                      stars = excluded.stars,
                      board = excluded.board`,
            args: [
                row.message,
                row.guild,
                row.channel,
                row.author,
                row.content,
                row.stars,
                row.board ?? null
            ]
        })
    );

export const deleteStar = (message: string) =>
    getClient().then((db) =>
        db.execute({
            sql: "DELETE FROM stars_data WHERE message = ?",
            args: [message]
        })
    );

export const findVote = async (guild: string, id: number, user: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT vote FROM suggestion_votes WHERE guild = ? AND id = ? AND user = ?",
        args: [guild, id, user]
    });
    return rows<{ vote: number }>(rs)[0]?.vote ?? null;
};

export const upsertVote = (
    guild: string,
    id: number,
    user: string,
    vote: number
) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO suggestion_votes (guild, id, user, vote)
                  VALUES (?, ?, ?, ?)
                  ON CONFLICT (guild, id, user) DO UPDATE SET vote = excluded.vote`,
            args: [guild, id, user, vote]
        })
    );

export const removeVote = (guild: string, id: number, user: string) =>
    getClient().then((db) =>
        db.execute({
            sql: "DELETE FROM suggestion_votes WHERE guild = ? AND id = ? AND user = ?",
            args: [guild, id, user]
        })
    );

export const countVotes = async (guild: string, id: number) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: `SELECT
                COUNT(CASE WHEN vote = 1 THEN 1 END) AS up,
                COUNT(CASE WHEN vote = -1 THEN 1 END) AS down
              FROM suggestion_votes WHERE guild = ? AND id = ?`,
        args: [guild, id]
    });
    const row = rows<{ up: number; down: number }>(rs)[0];
    return { up: Number(row?.up ?? 0), down: Number(row?.down ?? 0) };
};
