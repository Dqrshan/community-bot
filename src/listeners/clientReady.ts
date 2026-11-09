import { CronJob } from "cron";
import {
    Client,
    OverwriteType,
    PermissionFlagsBits,
    TextChannel
} from "discord.js";
import { databaseCh, guildId, ticketCategory } from "../config";
import Snipes from "../lib/snipes";
import Ticket, { tickets } from "../lib/Ticket";
import { backupToChannel } from "../lib/backup";

export default async function run(client: Client) {
    // load snipes
    const loaded = await Snipes.load();
    client.console.success(`Loaded ${loaded} sniped channel(s)`);

    // log info to console
    const { username, id } = client.user!;
    client.console.success(`Logged in as ${username} [${id}]`);

    // load open tickets
    const server = client.guilds.cache.get(guildId);
    const ticketChannels = server!.channels.cache
        .filter(
            (c) =>
                c.parentId === ticketCategory &&
                /ticket-\d+/.test(c.name) &&
                !c
                    .permissionsFor(server?.roles.everyone!)
                    ?.has(PermissionFlagsBits.ViewChannel)
        )
        .map((c) => c as TextChannel);

    for (const ticket of ticketChannels) {
        const ticketAuthor = ticket.permissionOverwrites.cache.find(
            (p) => p.type === OverwriteType.Member
        )?.id;
        if (!ticketAuthor) continue;
        const t = new Ticket(
            parseInt(ticket.name.split("-")[1] ?? "0"),
            await client.users.fetch(ticketAuthor),
            ticket,
            ticket.topic!
        );
        tickets.set(ticketAuthor, t);
    }
    if (tickets.size)
        client.console.info(`Restored ${tickets.size} open ticket(s)`);

    // database backups (dumps the live Turso database, no local files)
    const backupJob = new CronJob(
        "0 */6 * * *",
        async () => {
            const channel = client.channels.cache.get(
                databaseCh
            ) as TextChannel | null;
            if (!channel) return;
            await backupToChannel(channel).catch(client.console.error);
        },
        null,
        false,
        "Asia/Kolkata"
    );
    try {
        backupJob.start();
        client.console.info("Database backup job started");
    } catch (error) {
        client.console.error(error);
    }
}
