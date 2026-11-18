require("dotenv").config();
const { createClient } = require("@libsql/client");

// Tables present in the local @database.sqlite backup to merge into production Turso.
// Uses INSERT OR REPLACE (upsert) only — never DELETEs, so production-only rows are preserved.
const TABLES = ["afk_data", "mention_data", "settings_data", "snipes_data"];

(async () => {
    const local = createClient({ url: "file:./database.sqlite" });
    const turso = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    let grandTotal = 0;

    for (const table of TABLES) {
        // Read all rows from the local backup.
        const src = await local.execute(`SELECT * FROM ${table}`);
        const rows = src.rows;
        if (!rows.length) {
            console.log(`[${table}] 0 rows in backup — skipping`);
            continue;
        }

        const columns = Object.keys(rows[0]);
        const cols = columns.join(", ");
        const placeholders = columns.map(() => "?").join(", ");
        const sql = `INSERT OR REPLACE INTO ${table} (${cols}) VALUES (${placeholders})`;

        let upserted = 0;
        for (const row of rows) {
            const args = columns.map((c) => row[c]);
            await turso.execute({ sql, args });
            upserted++;
        }

        grandTotal += upserted;
        console.log(`[${table}] upserted ${upserted} row(s) into production Turso`);
    }

    console.log(`\nDone. Total rows upserted: ${grandTotal}`);
    console.log("No production rows were deleted — only backup rows were merged in (upsert).");
})().catch((err) => {
    console.error("SYNC FAILED:", err);
    process.exit(1);
});
