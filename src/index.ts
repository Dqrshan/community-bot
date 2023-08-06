import { config } from "dotenv";
import { loadCommands } from "./lib/command";
import { readdirSync } from "fs";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import consola from "consola";
import prisma from "./prisma/prisma";
import { prefix } from "./config";
import { Debugger } from "discord-debug";

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
client.prefix = prefix;
client.prisma = prisma;
client.commands = new Collection();
client.debugger = new Debugger(client, {
    registerApplicationCommands: false,
    loadDefaultListeners: {
        message: true,
        interaction: false
    },
    themeColor: "#5865f2"
});

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

client.on("error", client.console.error);
process.on("uncaughtException", client.console.error);
process.on("unhandledRejection", client.console.error);

Promise.all([loadEvents(client), loadCommands(client)]).then(() =>
    client.login(process.env.DISCORD_TOKEN)
);
