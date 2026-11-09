import type { TextChannel } from "discord.js";
import { AttachmentBuilder } from "discord.js";
import { getClient } from "./db";

const TABLES = [
    "afk_data",
    "mention_data",
    "snipes_data",
    "settings_data"
] as const;

const quote = (value: unknown): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number") return String(value);
    return `'${String(value).replaceAll("'", "''")}'`;
};

export const dumpDatabase = async (): Promise<string> => {
    const db = await getClient();
    const lines: string[] = [
        `BEGIN TRANSACTION;`,
        `-- Turso database backup (${new Date().toISOString()})`
    ];

    for (const table of TABLES) {
        const rs = await db.execute(`SELECT * FROM ${table}`);
        for (const row of rs.rows) {
            const columns = Object.keys(row);
            if (!columns.length) continue;
            const values = columns.map((c) => quote(row[c])).join(", ");
            lines.push(
                `INSERT OR REPLACE INTO ${table} (${columns.join(
                    ", "
                )}) VALUES (${values});`
            );
        }
    }

    lines.push(`COMMIT;`);
    return lines.join("\n");
};

export const backupToChannel = async (channel: TextChannel) => {
    const sql = await dumpDatabase();
    await channel.send({
        files: [
            new AttachmentBuilder(Buffer.from(sql, "utf-8"), {
                name: "turso-database-backup.sql"
            })
        ]
    });
};
