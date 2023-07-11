import { Command } from "../../lib/command";

const command: Command = {
    name: "debug",
    description: "Debug command",
    ownerOnly: true,
    messageRun: async (message, args) => {
        await message.client.debugger.messageRun(message, args!);
    }
};

export default command;
