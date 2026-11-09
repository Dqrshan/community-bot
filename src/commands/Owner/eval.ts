import { Message } from "discord.js";
import type { Command } from "../../lib/command";
import { isThenable } from "../../lib/isThenable";
import { errorEmbed } from "../../lib/response";
import { inspect } from "util";

const evalCommand: Command = {
    name: "eval",
    description: "Evaluate JavaScript code (owner only)",
    ownerOnly: true,
    aliases: ["js", "ev"],
    messageRun: async (msg: Message, args: string[] | undefined) => {
        if (!args || !args.length) {
            msg.reply({
                embeds: [errorEmbed("Please provide code to evaluate.")]
            });
            return;
        }
        const code = args.join(" ");

        const { result, success } = await Eval(msg, code, {
            async: code.includes("await") || code.includes("return"),
            depth: 2
        });

        const output = success
            ? "```js\n" + result + "\n```"
            : "**ERROR**:\n```bash\n" + result + "\n```";

        if (output.length > 2000) {
            return msg.reply({
                content: "The output was too long. It has been sent as a file.",
                files: [{ attachment: Buffer.from(output), name: "output.js" }]
            });
        }

        return msg.reply({ content: output });
    }
};

const Eval = async (
    msg: Message,
    code: string,
    flags: { async: boolean; depth: number }
) => {
    if (flags.async) code = `(async () => {\n${code}\n})();`;
    let success = true;
    let result = null;

    try {
        result = eval(code);
    } catch (error) {
        if (error) {
            msg.client.console.error(error);
        }
        result = error;
        success = false;
    }

    if (isThenable(result)) result = await result;

    if (typeof result !== "string") {
        result = inspect(result, {
            depth: flags.depth
        });
    }

    return { result, success };
};

export default evalCommand;
