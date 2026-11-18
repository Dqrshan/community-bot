require("dotenv").config();
const { createClient } = require("@libsql/client");

// Merge backup snipes into production Turso WITHOUT deleting any existing production data.
// For each channel present in the backup:
//   - If channel missing in production: insert the backup row.
//   - If channel exists in production: union the arrays by unique `message` id,
//     keeping production entries plus any new backup entries. Update the row.
(async () => {
    const local = createClient({ url: "file:./database.sqlite" });
    const turso = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    const backup = await local.execute("SELECT channel, data, timestamp FROM snipes_data");
    const bRows = backup.rows;
    console.log(`Backup snipes rows: ${bRows.length}`);

    let inserted = 0;
    let merged = 0;
    let skipped = 0;

    for (const row of bRows) {
        const channel = row.channel;
        const backupArr = JSON.parse(row.data || "[]");
        const backupTs = row.timestamp;

        const cur = await turso.execute(
            "SELECT data, timestamp FROM snipes_data WHERE channel = ?",
            [channel]
        );

        if (cur.rows.length === 0) {
            // Channel not in production — insert backup row as-is.
            await turso.execute({
                sql: "INSERT INTO snipes_data (channel, data, timestamp) VALUES (?, ?, ?)",
                args: [channel, row.data, backupTs]
            });
            inserted++;
            continue;
        }

        const curRow = cur.rows[0];
        let curArr = [];
        try { curArr = JSON.parse(curRow.data || "[]"); } catch { curArr = []; }

        // Build a set of existing message ids from production.
        const existingIds = new Set(curArr.map((e) => e.message).filter(Boolean));
        let added = 0;
        for (const entry of backupArr) {
            if (entry.message && !existingIds.has(entry.message)) {
                curArr.push(entry);
                existingIds.add(entry.message);
                added++;
            }
        }

        if (added === 0) {
            skipped++;
            continue;
        }

        // Keep the newer timestamp.
        const newTs = Math.max(curRow.timestamp || 0, backupTs);
        await turso.execute({
            sql: "UPDATE snipes_data SET data = ?, timestamp = ? WHERE channel = ?",
            args: [JSON.stringify(curArr), newTs, channel]
        });
        merged++;
        console.log(`  [${channel}] merged ${added} new snipes (production ${curArr.length - added} + backup ${added} = ${curArr.length})`);
    }

    console.log(`\nDone. Inserted: ${inserted}, Merged: ${merged}, Skipped (no new): ${skipped}`);

    // Verify the specific channel the user asked about.
    const check = await turso.execute(
        "SELECT data FROM snipes_data WHERE channel = ?",
        ["1031108420880842752"]
    );
    if (check.rows.length) {
        const arr = JSON.parse(check.rows[0].data || "[]");
        console.log(`\nVERIFY channel 1031108420880842752 => array length: ${arr.length}`);
    }

    // New total row count.
    const total = await turso.execute("SELECT COUNT(*) AS n FROM snipes_data");
    console.log(`Total snipes rows in production: ${total.rows[0].n}`);
})().catch((err) => {
    console.error("MERGE FAILED:", err);
    process.exit(1);
});
