import consola from "consola";
import type { Collection } from "discord.js";
import type { Command } from "./lib/command";
import type { PrismaClient } from "@prisma/client";
import type { Debugger } from "discord-debug";

export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN: string;
            AI_URL: string;
        }
    }
}

declare module "discord.js" {
    interface Client {
        console: typeof consola;
        commands: Collection<string, Command>;
        prefix: string;
        prisma: PrismaClient;
        debugger: Debugger;
        queue: Message[];
    }
}

export type Mention = {
    member: String;
    timestamp: Number;
    message: String;
};

export type ChatData = {
    response: string | null | undefined;
};
