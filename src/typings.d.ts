import consola from "consola";
import type { Collection, Message } from "discord.js";
import type { Command } from "./lib/command";

export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DISCORD_TOKEN?: string;
            DISCORD_BOT_TOKEN?: string;
            AI_URL?: string;
            TURSO_DATABASE_URL?: string;
            TURSO_AUTH_TOKEN?: string;
            NVIDIA_API_KEY?: string;
        }
    }
}

declare module "discord.js" {
    interface Client {
        console: typeof consola;
        commands: Collection<string, Command>;
        prefix: string;
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
