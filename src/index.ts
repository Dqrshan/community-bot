import { config } from "dotenv";
import { loadCommands } from "./lib/command";
import { readdirSync } from "fs";
import { createServer } from "http";
import {
    ActivityType,
    Client,
    Collection,
    GatewayIntentBits,
    Partials
} from "discord.js";
import consola from "consola";
import { ensureSchema, findAfk } from "./lib/db";
import { prefix } from "./config";

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
        Partials.Message
    ],
    presence: {
        activities: [
            {
                name: `${prefix}help`,
                type: ActivityType.Listening
            }
        ],
        status: "online"
    }
});

client.console = consola;
client.prefix = prefix;
client.commands = new Collection();
client.queue = [];

const loadEvents = async (client: Client) => {
    client.console.info("Loading events..");
    let count = 0;
    const files = readdirSync("dist/listeners").filter((x) =>
        x.endsWith(".js")
    );
    for (const file of files) {
        count += 1;
        const { default: run } = require(`./listeners/${file}`);
        if (!run) continue;
        const name = file.split(".")[0];
        client.on(name, run);
    }
    client.console.success(`Listening to ${count} events`);
};

client.on("error", client.console.error);
process.on("uncaughtException", client.console.error);
process.on("unhandledRejection", client.console.error);

const port =
    Number(process.env.X_ZOHO_CATALYST_LISTEN_PORT) ||
    Number(process.env.PORT) ||
    8080;
createServer((req, res) => {
    if (req.url === "/ping") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("pong");
        return;
    }
    if (req.url === "/health") {
        Promise.all([
            Promise.resolve(client.isReady()),
            findAfk("health", "probe")
                .then(() => true)
                .catch(() => false)
        ]).then(([ready, db]) => {
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(
                JSON.stringify({
                    status: db && ready ? "ok" : "degraded",
                    uptime: process.uptime(),
                    ready,
                    db
                })
            );
        });
        return;
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`${client.user?.username ?? "Bot"} is running`);
}).listen(port, () => {
    client.console.info(`Health server listening on port ${port}`);
});

ensureSchema()
    .then(() =>
        Promise.all([loadEvents(client), loadCommands(client)])
    )
    .then(() =>
        client.login(
            process.env.DISCORD_TOKEN ?? process.env.DISCORD_BOT_TOKEN
        )
    )
    .catch((error) => {
        client.console.error(error);
        process.exit(1);
    });
