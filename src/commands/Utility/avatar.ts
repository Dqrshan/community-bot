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
    description: "View the avatar, banner & server avatar of a user",
    aliases: ["av", "pfp", "banner"],
    usage: "[userID] | [@user]",
    examples: ["<@838620835282812969>", "838620835282812969", " "],
    messageRun: async (msg: Message, args?: string[]) => {
        let user: User;
        if (msg.mentions && msg.mentions.users && msg.mentions.users.size) {
            user = msg.mentions.users.first()!;
        } else if (args!.length) {
            user = await msg.client.users.fetch(args![0]).catch(() => null!);
            if (!user) {
                return msg.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor("Red")
                            .setDescription("❌ I couldn't find that user.")
                    ]
                });
            }
        } else {
            user = msg.author;
        }
        const member = msg.guild
            ? await msg.guild.members.fetch({ user }).catch(() => null)
            : null;

        const base = new EmbedBuilder()
            .setTitle(`${user.displayName}'s Profile`)
            .setURL(`https://discord.com/users/${user.id}`)
            .setColor(member ? member.displayHexColor : "#2F3136")
            .setFooter({
                text: user.id,
                iconURL: user.displayAvatarURL()
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

        const mkButton = (
            label: string,
            id: string,
            emoji: string
        ): ButtonBuilder =>
            new ButtonBuilder()
                .setLabel(label)
                .setCustomId(id)
                .setEmoji(emoji)
                .setStyle(ButtonStyle.Secondary);

        const allButtons = [
            mkButton("Avatar", "_A", "🖼️"),
            mkButton("Banner", "_B", "🎨"),
            mkButton("Server", "_S", "🏠")
        ];
        let activeButtons: ButtonBuilder[] = [];

        const row = new ActionRowBuilder<ButtonBuilder>();
        let initial: Message;

        if (member && member.avatar && user.banner) {
            activeButtons = allButtons;
        } else if (member && member.avatar && !user.banner) {
            activeButtons = [allButtons[0], allButtons[2]];
        } else if (user.banner) {
            activeButtons = [allButtons[0], allButtons[1]];
        }

        if (activeButtons.length) {
            initial = await msg.reply({
                components: [row.setComponents(activeButtons)],
                embeds: [avatar]
            });
        } else {
            initial = await msg.reply({ embeds: [avatar] });
        }

        if (!activeButtons.length) return;

        const collector = initial.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60 * 1000,
            filter: (i) => i.user.id === msg.author.id
        });

        collector.on("collect", async (ctx) => {
            await ctx.deferUpdate().catch(() => {});
            const view =
                ctx.customId === "_A"
                    ? avatar
                    : ctx.customId === "_B"
                    ? banner
                    : server;
            await initial.edit({ embeds: [view] }).catch(() => {});
            collector.resetTimer();
        });

        collector.on("end", async () => {
            await initial
                .edit({
                    components: [
                        row.setComponents(
                            activeButtons.map((b) => b.setDisabled(true))
                        )
                    ]
                })
                .catch(() => {});
        });
    }
};

export default avatar;
