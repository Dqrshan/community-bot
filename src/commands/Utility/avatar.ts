import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
    Message,
    User
} from "discord.js";
import { Command } from "../../lib/command";

const avatar: Command = {
    name: "avatar",
    description: "View the avatar (and banner) of a user",
    aliases: ["av"],
    usage: "[userID] | [@user]",
    examples: ["<@838620835282812969>", "838620835282812969", " "],
    messageRun: async (msg: Message, args?: string[]) => {
        let user: User;
        if (msg.mentions && msg.mentions.users && msg.mentions.users.size) {
            user = msg.mentions.users.first()!;
        } else if (args!.length) {
            user = await msg.client.users.fetch(args![0]);
        } else {
            user = msg.author;
        }
        const member = msg.guild
            ? await msg.guild.members.fetch({ user }).catch(() => null)
            : null;

        const base = new EmbedBuilder()
            .setTitle(user.tag)
            .setURL(`https://discord.com/users/${user.id}`)
            .setColor(member ? member.displayHexColor : "#2F3136")
            .setFooter({
                text: user.id,
                iconURL:
                    "https://cdn.discordapp.com/emojis/906948621486944288.png"
            });

        const avatar = EmbedBuilder.from(
            base.setImage(user.avatarURL({ size: 512 })).toJSON()
        );

        (await user.fetch()).banner;
        const banner = EmbedBuilder.from(base.toJSON());
        if (user.banner) {
            banner.setImage(user.bannerURL({ size: 512 })!);
        }

        const server = EmbedBuilder.from(base.toJSON());
        if (member) {
            (await member.fetch()).avatar;
            if (member.avatar) {
                server.setImage(member.avatarURL({ size: 512 }));
            }
        }

        const buttons = [
            new ButtonBuilder()
                .setLabel("Avatar")
                .setCustomId("_A")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel("Banner")
                .setCustomId("_B")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setLabel("Server")
                .setCustomId("_S")
                .setStyle(ButtonStyle.Secondary)
        ];
        let sentButtons: ButtonBuilder[] = [];

        const row = new ActionRowBuilder<ButtonBuilder>();

        let initial: Message;
        if (member && member.avatar && user.banner) {
            initial = await msg.reply({
                components: [row.setComponents(buttons)],
                embeds: [avatar]
            });
            sentButtons = buttons;
        } else if (member && member.avatar && !user.banner) {
            initial = await msg.reply({
                components: [row.setComponents(buttons[0], buttons[2])],
                embeds: [avatar]
            });
            sentButtons.push(buttons[0], buttons[2]);
        } else if (user.banner) {
            initial = await msg.reply({
                components: [row.setComponents(buttons[0], buttons[1])],
                embeds: [avatar]
            });
            sentButtons.push(buttons[0], buttons[1]);
        } else {
            initial = await msg.reply({
                embeds: [avatar]
            });
            sentButtons = [];
        }

        const collector = initial.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60 * 1000,
            filter: (i) => i.user.id === msg.author.id
        });

        collector.on("collect", async (ctx) => {
            await ctx.deferUpdate().catch(() => {});
            if (ctx.customId === "_A") {
                await initial
                    .edit({
                        embeds: [avatar]
                    })
                    .catch(() => {});
            } else if (ctx.customId === "_B") {
                await initial
                    .edit({
                        embeds: [banner]
                    })
                    .catch(() => {});
            } else if (ctx.customId === "_S") {
                await initial
                    .edit({
                        embeds: [server]
                    })
                    .catch(() => {});
            }
            collector.resetTimer();
        });

        collector.on("end", async () => {
            await initial
                .edit({
                    components: [
                        row.setComponents(
                            sentButtons.length
                                ? sentButtons.map((b) => b.setDisabled(true))
                                : []
                        )
                    ]
                })
                .catch(() => {});
        });
    }
};

export default avatar;
