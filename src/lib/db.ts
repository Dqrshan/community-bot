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

export type PollRow = {
    key: string;
    guild: string;
    channel: string;
    message: string | null;
    author: string;
    question: string;
    options: string;
    timestamp: number;
};

export type ReminderRow = {
    id: number;
    guild: string;
    channel: string;
    user: string;
    text: string;
    remind_at: number;
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
    await db.execute(`
        CREATE TABLE IF NOT EXISTS polls_data (
            key TEXT PRIMARY KEY,
            guild TEXT NOT NULL,
            channel TEXT NOT NULL,
            message TEXT,
            author TEXT NOT NULL,
            question TEXT NOT NULL,
            options TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS poll_votes (
            poll TEXT NOT NULL,
            user TEXT NOT NULL,
            option INTEGER NOT NULL,
            PRIMARY KEY (poll, user)
        )
    `);
    await db.execute(`
        CREATE TABLE IF NOT EXISTS reminders_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild TEXT NOT NULL,
            channel TEXT NOT NULL,
            user TEXT NOT NULL,
            text TEXT NOT NULL,
            remind_at INTEGER NOT NULL
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

export const insertPoll = (
    poll: Omit<PollRow, "message"> & { message?: string | null }
) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO polls_data (key, guild, channel, message, author, question, options, timestamp)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                poll.key,
                poll.guild,
                poll.channel,
                poll.message ?? null,
                poll.author,
                poll.question,
                poll.options,
                poll.timestamp
            ]
        })
    );

export const setPollMessage = (key: string, message: string) =>
    getClient().then((db) =>
        db.execute({
            sql: "UPDATE polls_data SET message = ? WHERE key = ?",
            args: [message, key]
        })
    );

export const findPoll = async (key: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT * FROM polls_data WHERE key = ?",
        args: [key]
    });
    return rows<PollRow>(rs)[0] ?? null;
};

export const findPollVote = async (poll: string, user: string) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT option FROM poll_votes WHERE poll = ? AND user = ?",
        args: [poll, user]
    });
    return rows<{ option: number }>(rs)[0]?.option ?? null;
};

export const setPollVote = (poll: string, user: string, option: number) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO poll_votes (poll, user, option) VALUES (?, ?, ?)
                  ON CONFLICT (poll, user) DO UPDATE SET option = excluded.option`,
            args: [poll, user, option]
        })
    );

export const removePollVote = (poll: string, user: string) =>
    getClient().then((db) =>
        db.execute({
            sql: "DELETE FROM poll_votes WHERE poll = ? AND user = ?",
            args: [poll, user]
        })
    );

export const countPollVotes = async (poll: string, optionCount: number) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: `SELECT option, COUNT(*) AS count FROM poll_votes
              WHERE poll = ? GROUP BY option`,
        args: [poll]
    });
    const counts = new Array(optionCount).fill(0) as number[];
    let voters = 0;
    for (const row of rows<{ option: number; count: number }>(rs)) {
        const index = Number(row.option);
        const count = Number(row.count);
        if (index >= 0 && index < optionCount) counts[index] = count;
        voters += count;
    }
    return { counts, voters };
};

export const insertReminder = (
    reminder: Omit<ReminderRow, "id">
) =>
    getClient().then((db) =>
        db.execute({
            sql: `INSERT INTO reminders_data (guild, channel, user, text, remind_at)
                  VALUES (?, ?, ?, ?, ?)`,
            args: [
                reminder.guild,
                reminder.channel,
                reminder.user,
                reminder.text,
                reminder.remind_at
            ]
        })
    );

export const dueReminders = async (now: number) => {
    const db = await getClient();
    const rs = await db.execute({
        sql: "SELECT * FROM reminders_data WHERE remind_at <= ? ORDER BY remind_at ASC LIMIT 25",
        args: [now]
    });
    return rows<ReminderRow>(rs);
};

export const deleteReminder = (id: number) =>
    getClient().then((db) =>
        db.execute({
            sql: "DELETE FROM reminders_data WHERE id = ?",
            args: [id]
        })
    );
