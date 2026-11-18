import type { Message } from "discord.js";
import { V2, statusContainer } from "./components";

export const DOT = "・";

export const replySuccess = (msg: Message, description: string) =>
    msg.reply({
        components: [statusContainer("success", description)],
        flags: V2
    });

export const replyError = (msg: Message, description: string) =>
    msg.reply({
        components: [statusContainer("error", description)],
        flags: V2
    });

export const replyInfo = (msg: Message, description: string) =>
    msg.reply({
        components: [statusContainer("info", description)],
        flags: V2
    });
