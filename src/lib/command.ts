import type { Message, PermissionResolvable, Client } from "discord.js";
import { readdirSync } from "fs";

export interface Command {
    name: string;
    description?: string;
    aliases?: string[];
    usage?: string;
    examples?: string[];
    permissions?: PermissionResolvable;
    category?: string;
    cooldown?: number | 1000;
    ownerOnly?: boolean | false;
    staffOnly?: boolean | false;

    condition?: (msg: Message) => string | boolean;
    messageRun?: (msg: Message, args?: string[]) => Promise<unknown>;
}

export async function loadCommands(client: Client) {
    const dirs = readdirSync("dist/commands");
    for (const dir of dirs) {
        const files = readdirSync(`dist/commands/${dir}`).filter((x) =>
            x.endsWith(".js")
        );
        for (const file of files) {
            const { default: command } = await import(
                `../commands/${dir}/${file}`
            );
            if (!command || !command.name) continue;
            command.category = dir;
            client.commands.set(command.name, command);
        }
    }
    client.console.success(`Registered ${client.commands.size} command(s)`);
}
