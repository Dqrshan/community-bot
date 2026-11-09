import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Message
} from "discord.js";
import { Command } from "../../lib/command";
import { DOT, errorEmbed } from "../../lib/response";
import { links } from "../../config";

const rules = () => [
    {
        rule: 1,
        title: "Be respectful",
        content:
            "Be respectful and civil. We have absolutely zero tolerance for any racism, sexism, hate speech, or any other offensive or disruptive behaviour. This applies to voice chats as well. The use of profanity should be kept to a minimum."
    },
    {
        rule: 2,
        title: "English only",
        content:
            "Please keep all discussion in text channels and general voice channels in English."
    },
    {
        rule: 3,
        title: "No NSFW content",
        content:
            "Absolutely no NSFW, offensive or disruptive content. This includes content on your Discord profile (profile picture, username, etc.)."
    },
    {
        rule: 4,
        title: "Discord guidelines",
        content:
            "Adhere to Discord's Community Guidelines (<https://discord.com/guidelines>) and Terms of Service (<https://discord.com/terms>)."
    },
    {
        rule: 5,
        title: "No spam",
        content:
            "Don't spam. This includes excessive amounts of messages, emojis, capital letters, pings or mentions, etc."
    },
    {
        rule: 6,
        title: "Right channels",
        content: "Use the appropriate channels for messaging or posting content."
    },
    {
        rule: 7,
        title: "No advertising",
        content:
            "No advertisements. We do not tolerate any kind of advertisements, whether it be for other communities or streams. You can post your content in the media channel if it is relevant and provides actual value (video or art)."
    }
];

const rule: Command = {
    name: "rule",
    aliases: ["rules", "r"],
    description: "Look up a server rule by number or keyword",
    usage: "[ruleNo] | [search]",
    examples: ["1", "3", "spam", "nsfw", " "],
    messageRun: async (msg: Message, args?: string[]) => {
        const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setLabel("Full rules")
                .setStyle(ButtonStyle.Link)
                .setURL(links.rules)
        );

        const search = isNaN(parseInt(args![0]))
            ? args![0]
            : parseInt(args![0]);

        if (!search) {
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setAuthor({
                    name: "Server rules",
                    iconURL: msg.client.user?.displayAvatarURL()
                })
                .setDescription(
                    rules()
                        .map((r) => `${r.rule} ${DOT} ${r.title}`)
                        .join("\n")
                )
                .setFooter({
                    text: `Use ${msg.client.prefix}rule <number> to read one`
                });
            return msg.reply({ embeds: [embed], components: [button] });
        }

        const user = msg.reference
            ? (await msg.channel.messages.fetch(msg.reference.messageId!))
                  .author
            : null;

        const matched =
            typeof search === "string"
                ? rules().find((e) =>
                      `${e.title} ${e.content}`
                          .toLowerCase()
                          .includes(search.toLowerCase())
                  )
                : rules().find((e) => e.rule === search);

        const embed = matched
            ? new EmbedBuilder()
                  .setColor("Blurple")
                  .setTitle(`Rule ${matched.rule} ${DOT} ${matched.title}`)
                  .setDescription(matched.content)
                  .setFooter({
                      text: user
                          ? `Suggested for ${user.username}`
                          : `Requested by ${msg.author.username}`,
                      iconURL: msg.author.displayAvatarURL()
                  })
                  .setTimestamp()
            : errorEmbed(
                  "I couldn't find a rule matching what you were looking for."
              );

        return msg.reply({ embeds: [embed], components: [button] });
    }
};

export default rule;
