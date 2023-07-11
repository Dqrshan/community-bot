import { CronJob } from "cron";
import {
    ActivityType,
    AttachmentBuilder,
    Client,
    TextChannel
} from "discord.js";
import { databaseCh } from "../config";
import Snipes from "../utils/snipes";

export default async function run(client: Client) {
    // activity
    client.user?.setPresence({
        activities: [
            {
                name: `${client.prefix}help`,
                type: ActivityType.Listening
            }
        ],
        status: "dnd"
    });

    // load snipes
    await Snipes.load(client);

    // log info to console
    const { tag, id } = client.user!;
    client.console.success(`Logged in as ${tag} [${id}]`);

    // database backups
    const job = new CronJob(
        "0 */6 * * *",
        async () => {
            const file = new AttachmentBuilder("src/prisma/database.sqlite", {
                name: "database.sqlite"
            });
            await (client.channels.cache.get(databaseCh) as TextChannel)
                .send({
                    files: [file]
                })
                .catch(client.console.error);
        },
        null,
        false,
        "Asia/Kolkata"
    );
    try {
        job.start();
        client.console.info("Database backup job started");
    } catch (error) {
        client.console.error(error);
    }
}
