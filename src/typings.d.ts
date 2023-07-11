import consola from "consola";
import type { Collection } from "discord.js";
import type { Command } from "./lib/command";
import type { PrismaClient } from "@prisma/client";

export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN: string;
        }
    }
}

declare module "discord.js" {
    interface Client {
        console: typeof consola;
        commands: Collection<string, Command>;
        prefix: string;
        prisma: PrismaClient;
    }
}

export type Mention = {
    member: String;
    timestamp: Number;
    message: String;
};
