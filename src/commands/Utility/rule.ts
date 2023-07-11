import { Command } from "../../lib/command";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Message
} from "discord.js";
import { links } from "../../config";
import { stripIndents } from "common-tags";

const rule: Command = {
    name: "rule",
    aliases: ["rules", "r"],
    description: "Rule tags, straight up coming from <#1083272137021866045>",
    messageRun: async (msg: Message, args?: string[]) => {
        const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setLabel("Rules")
                .setStyle(ButtonStyle.Link)
                .setURL(links.rules)
        );

        const search = isNaN(parseInt(args![0]))
            ? args![0]
            : parseInt(args![0]);

        if (!search) return msg.reply({ components: [button] });

        const keys = rules().map((m) => m.rule);
        const user = msg.reference
            ? (await msg.channel.messages.fetch(msg.reference.messageId!))
                  .author
            : null;
        let content = user ? `*Rule suggestion for <@!${user.id}>*:\n` : "";

        if (typeof search === "string") {
            const rule = rules().find((e) =>
                e.content.toLowerCase().includes(search)
            );
            if (rule) {
                content += rule.content;
            } else {
                content = "Couldn't find what you were looking for!";
            }
        } else {
            if (search && keys.includes(search)) {
                content += rules().find((e) => e.rule === search)!.content;
            } else {
                content = "Couldn't find what you were looking for!";
            }
        }

        return msg.reply({
            components: [button],
            content
        });
    }
};
const rules = () => {
    return [
        {
            rule: 1,
            content: stripIndents`
            			**Rule 1**・Be respectful and civil. We have absolutely zero tolerance for any racism, sexism, hate speech, or any other offensive/disruptive behaviour. This applies to voice chats as well. The use of profanity should be kept to a minimum.`
        },
        {
            rule: 2,
            content: stripIndents`
            			**Rule 2**・Please keep all discussion in text channels and general voice channels in English.`
        },
        {
            rule: 3,
            content: stripIndents`
				**Rule 3**・Absolutely no NSFW, offensive or disruptive content. This includes content on your Discord profile (profile picture, username, etc.).`
        },
        {
            rule: 4,
            content: stripIndents`
				**Rule 4**・Adhere to Discord's Community Guidelines (<https://discord.com/guidelines>) and Terms of Service (<https://discord.com/terms>).`
        },
        {
            rule: 5,
            content: stripIndents`
				**Rule 5**・Don't spam. This includes excessive amounts of messages, emojis, capital letters, pings/mentions, etc.`
        },
        {
            rule: 6,
            content: stripIndents`
				**Rule 6**・Use the appropriate channels for messaging or posting content.`
        },
        {
            rule: 7,
            content: stripIndents`
				**Rule 7**・No advertisements. We do not tolerate any kind of advertisements, whether it be for other communities or streams. You can post your content in the media channel if it is relevant and provides actual value (video/art).`
        }
    ];
};

export default rule;
