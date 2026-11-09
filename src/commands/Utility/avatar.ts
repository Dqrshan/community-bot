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
import { errorEmbed } from "../../lib/response";

const avatar: Command = {
    name: "avatar",
    description: "View the avatar and banner of a user",
    aliases: ["av", "pfp"],
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
                    embeds: [errorEmbed("I couldn't find that user.")]
                });
            }
        } else {
            user = msg.author;
        }
        const member = msg.guild
            ? await msg.guild.members.fetch({ user }).catch(() => null)
            : null;

        const base = new EmbedBuilder()
            .setTitle(`${user.displayName}`)
            .setURL(`https://discord.com/users/${user.id}`)
            .setColor(member ? member.displayHexColor : "#2F3136")
            .setFooter({ text: user.id, iconURL: user.displayAvatarURL() });

        const avatarView = EmbedBuilder.from(
            base.setImage(user.avatarURL({ size: 512 })).toJSON()
        );

        (await user.fetch()).banner;
        const bannerView = EmbedBuilder.from(base.toJSON());
        if (user.banner) {
            bannerView.setImage(user.bannerURL({ size: 512 })!);
        }

        const serverView = EmbedBuilder.from(base.toJSON());
        if (member) {
            (await member.fetch()).avatar;
            if (member.avatar) {
                serverView.setImage(member.avatarURL({ size: 512 }));
            }
        }

        const views = [
            { id: "_A", label: "Avatar", embed: avatarView, enabled: true },
            {
                id: "_B",
                label: "Banner",
                embed: bannerView,
                enabled: Boolean(user.banner)
            },
            {
                id: "_S",
                label: "Server",
                embed: serverView,
                enabled: Boolean(member?.avatar)
            }
        ];
        const active = views.filter((v) => v.enabled);

        const row = new ActionRowBuilder<ButtonBuilder>();
        let initial: Message;

        if (active.length > 1) {
            initial = await msg.reply({
                components: [
                    row.setComponents(
                        active.map((v) =>
                            new ButtonBuilder()
                                .setLabel(v.label)
                                .setCustomId(v.id)
                                .setStyle(ButtonStyle.Secondary)
                        )
                    )
                ],
                embeds: [avatarView]
            });
        } else {
            initial = await msg.reply({ embeds: [avatarView] });
            return;
        }

        const collector = initial.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60 * 1000,
            filter: (i) => i.user.id === msg.author.id
        });

        collector.on("collect", async (ctx) => {
            await ctx.deferUpdate().catch(() => {});
            const view = active.find((v) => v.id === ctx.customId);
            if (view) await initial.edit({ embeds: [view.embed] }).catch(() => {});
            collector.resetTimer();
        });

        collector.on("end", async () => {
            await initial
                .edit({
                    components: [
                        row.setComponents(
                            active.map((v) =>
                                new ButtonBuilder()
                                    .setLabel(v.label)
                                    .setCustomId(v.id)
                                    .setStyle(ButtonStyle.Secondary)
                                    .setDisabled(true)
                            )
                        )
                    ]
                })
                .catch(() => {});
        });
    }
};

export default avatar;
