import { config } from "dotenv";
import { loadCommands } from "./lib/command";
import { readdirSync } from "fs";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import consola from "consola";
import prisma from "./prisma/prisma";
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
    ]
});

client.console = consola;
client.commands = new Collection();
client.prefix = prefix;
client.prisma = prisma;

const loadEvents = async (client: Client) => {
    client.console.info("Loading events..");
    let count = 0;
    const files = readdirSync("dist/listeners").filter((x) =>
        x.endsWith(".js")
    );
    for (const file of files) {
        count += 1;
        const { default: run } = await import(`./listeners/${file}`);
        if (!run) continue;
        const name = file.split(".")[0];
        client.on(name, run);
    }
    client.console.success(`Listening to ${count} events`);
};

// client.on("debug", console.debug);
// client.on("warn", console.warn);

// process.on("uncaughtException", () => console.error);
// process.on("unhandledRejection", () => console.error);

Promise.all([loadEvents(client), loadCommands(client)]).then(() =>
    client.login(process.env.DISCORD_TOKEN)
);
