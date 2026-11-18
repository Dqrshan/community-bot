import {
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    Message,
    User
} from "discord.js";
import { Command } from "../../lib/command";
import {
    actionRow,
    card,
    COLORS,
    divider,
    gallery,
    statusContainer,
    text,
    V2
} from "../../lib/components";
import { DOT } from "../../lib/response";

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
                    components: [
                        statusContainer(
                            "error",
                            "I couldn't find that user."
                        )
                    ],
                    flags: V2
                });
            }
        } else {
            user = msg.author;
        }
        const member = msg.guild
            ? await msg.guild.members.fetch({ user }).catch(() => null)
            : null;

        const fetchedUser = await user.fetch();
        const avatarUrl = user.displayAvatarURL({ size: 512 });
        const bannerUrl = fetchedUser.bannerURL({ size: 512 });
        const serverUrl = member?.avatarURL({ size: 512 }) ?? null;

        const accent =
            member && member.displayHexColor !== "#000000"
                ? parseInt(member.displayHexColor.slice(1), 16)
                : COLORS.info;

        const views = [
            { label: "Avatar", url: avatarUrl },
            { label: "Banner", url: bannerUrl },
            { label: "Server", url: serverUrl }
        ].filter((v): v is { label: string; url: string } => Boolean(v.url));

        const build = (active: number, disabled = false) => {
            const container = card(
                accent,
                text(`## ${user.displayName}`),
                text(`-# <@${user.id}> ${DOT} ${user.id}`),
                divider(),
                gallery([views[active].url], `${user.username} ${views[active].label}`)
            );

            if (views.length > 1)
                container.addActionRowComponents(
                    actionRow(
                        ...views.map((view, index) =>
                            new ButtonBuilder()
                                .setLabel(view.label)
                                .setCustomId(`av_${index}`)
                                .setStyle(
                                    index === active
                                        ? ButtonStyle.Primary
                                        : ButtonStyle.Secondary
                                )
                                .setDisabled(disabled)
                        )
                    )
                );

            return container;
        };

        const initial = await msg.reply({
            components: [build(0)],
            flags: V2
        });

        if (views.length <= 1) return;

        let active = 0;
        const collector = initial.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60 * 1000,
            filter: (i) => i.user.id === msg.author.id
        });

        collector.on("collect", async (ctx) => {
            await ctx.deferUpdate().catch(() => {});
            const index = parseInt(ctx.customId.replace("av_", ""));
            if (!isNaN(index) && views[index]) active = index;
            await initial
                .edit({ components: [build(active)] })
                .catch(() => {});
            collector.resetTimer();
        });

        collector.on("end", async () => {
            await initial
                .edit({ components: [build(active, true)] })
                .catch(() => {});
        });
    }
};

export default avatar;
