import consola from "consola";
import type { Collection, Message } from "discord.js";
import type { Command } from "./lib/command";
import type { PrismaClient } from "@prisma/client";

export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN?: string;
            DISCORD_BOT_TOKEN?: string;
            AI_URL?: string;
        }
    }
}

declare module "discord.js" {
    interface Client {
        console: typeof consola;
        commands: Collection<string, Command>;
        prefix: string;
        prisma: PrismaClient;
        queue: Message[];
    }
}

export type Mention = {
    member: string;
    timestamp: number;
    message: string;
};

export type ChatData = {
    response: string | null | undefined;
};
