import { AttachmentBuilder, Message } from "discord.js";
import type { Command } from "../../lib/command";
import {
    attachmentRow,
    card,
    COLORS,
    divider,
    statusContainer,
    text,
    V2
} from "../../lib/components";
import { isThenable } from "../../lib/isThenable";
import { inspect } from "util";

const evalCommand: Command = {
    name: "eval",
    description: "Evaluate JavaScript code (owner only)",
    ownerOnly: true,
    aliases: ["js", "ev"],
    messageRun: async (msg: Message, args: string[] | undefined) => {
        if (!args || !args.length) {
            return msg.reply({
                components: [
                    statusContainer(
                        "error",
                        "Please provide code to evaluate."
                    )
                ],
                flags: V2
            });
        }
        const code = args.join(" ");

        const { result, success } = await Eval(msg, code, {
            async: code.includes("await") || code.includes("return"),
            depth: 2
        });

        const output = success
            ? "```js\n" + result + "\n```"
            : "**ERROR**:\n```bash\n" + result + "\n```";

        if (output.length > 3400) {
            return msg.reply({
                components: [
                    card(
                        success ? COLORS.success : COLORS.danger,
                        text(
                            success
                                ? "### Output"
                                : "### Output (error)"
                        ),
                        divider(),
                        text("-# The output was too long, so it was attached as a file."),
                        attachmentRow("output.js")
                    )
                ],
                files: [
                    new AttachmentBuilder(Buffer.from(output), {
                        name: "output.js"
                    })
                ],
                flags: V2
            });
        }

        return msg.reply({
            components: [
                card(
                    success ? COLORS.success : COLORS.danger,
                    text(success ? "### Output" : "### Output (error)"),
                    divider(),
                    text(output)
                )
            ],
            flags: V2
        });
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
