import { CronJob } from "cron";
import {
    ActivityType,
    AttachmentBuilder,
    Client,
    OverwriteType,
    PermissionFlagsBits,
    TextChannel
} from "discord.js";
import { databaseCh, guildId, ticketCategory } from "../config";
import Snipes from "../lib/snipes";
import Ticket, { tickets } from "../lib/Ticket";

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

    // load tickets
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
