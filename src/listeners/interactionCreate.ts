import { type GuildMember, type Interaction } from "discord.js";
import { gradeRoles, schoolRoles } from "../config";
import { askReasonForTicket, createTicket, deleteTicket } from "../lib/Ticket";

export default async function run(ctx: Interaction) {
    if (ctx.user.bot || ctx.user.system || !ctx.guild) return;
    // ticketting
    if (ctx.isButton() && ctx.customId === "NEW")
        return askReasonForTicket(ctx);

    if (ctx.isModalSubmit() && ctx.customId === "CREATE_TICKET")
        return await createTicket(ctx);

    if (ctx.isButton() && ctx.customId === "CLOSE") return deleteTicket(ctx);

    // role menu
    if (ctx.isButton()) {
        if (ctx.customId.startsWith("a-") || ctx.customId.startsWith("p-")) {
            await ctx
                .deferReply({ ephemeral: true, fetchReply: true })
                .catch(() => {});
            const id = ctx.customId.replace("a-", "").replace("p-", "");
            const role = ctx.guild.roles.cache.get(id);
            if (!role) {
                await ctx
                    .editReply({
                        content: "I cannot seem to find that role.."
                    })
                    .catch(() => {});
                return;
            }
            if ((ctx.member as GuildMember).roles.cache.has(role.id)) {
                (ctx.member as GuildMember).roles
                    .remove(role.id)
                    .catch(() => {});
                await ctx
                    .editReply({
                        content: `\\❌ Removed <@&${role.id}>!`
                    })
                    .catch(() => {});
                return;
            } else {
                (ctx.member as GuildMember).roles.add(role.id).catch(() => {});
                await ctx
                    .editReply({
                        content: `\\✅ Added <@&${role.id}>!`
                    })
                    .catch(() => {});
                return;
            }
        } else if (ctx.customId.startsWith("g-")) {
            await ctx
                .deferReply({ ephemeral: true, fetchReply: true })
                .catch(() => {});
            const id = ctx.customId.replace("g-", "");
            const role = ctx.guild.roles.cache.get(id);
            if (!role) {
                await ctx
                    .editReply({
                        content: "I cannot seem to find that role.."
                    })
                    .catch(() => {});
                return;
            }
            const grades = gradeRoles.map((d) => d.role);
            if (
                (ctx.member as GuildMember).roles.cache.some((r) =>
                    grades.includes(r.id)
                )
            ) {
                await ctx
                    .editReply({
                        content:
                            "You already have a grade role! Please open a ticket in <#1031159883673911336> to change."
                    })
                    .catch(() => {});
                return;
            } else {
                (ctx.member as GuildMember).roles.add(role.id).catch(() => {});
                await ctx
                    .editReply({
                        content: `\\✅ Added <@&${role.id}>!`
                    })
                    .catch(() => {});
                return;
            }
        }
    }

    if (ctx.isStringSelectMenu() && ctx.customId === "SCHOOL") {
        await ctx
            .deferReply({ ephemeral: true, fetchReply: true })
            .catch(() => {});
        if (
            (ctx.member as GuildMember).roles.cache.some((r) =>
                r.name.toLowerCase().includes("alumnus")
            )
        ) {
            await ctx.editReply({
                content: "You cannot add school roles!"
            });
            return;
        }
        const [value] = ctx.values;
        const role = ctx.guild.roles.cache.get(value);
        if (!role) {
            await ctx
                .editReply({
                    content: "I cannot seem to find that role.."
                })
                .catch(() => {});
            return;
        }

        if (
            (ctx.member as GuildMember).roles.cache.some((r) =>
                schoolRoles.includes(r.id)
            )
        ) {
            const has = (ctx.member as GuildMember).roles.cache.find((r) =>
                schoolRoles.includes(r.id)
            );

            if (has && has.id === role.id) {
                await (ctx.member as GuildMember).roles
                    .remove(has.id)
                    .catch(() => {});

                return ctx.editReply({
                    content: `\\❌ Removed <@&${has.id}>`
                });
            } else {
                await (ctx.member as GuildMember).roles
                    .remove(has!.id)
                    .catch(() => {});
                await (ctx.member as GuildMember).roles
                    .add(role.id)
                    .catch(() => {});

                return ctx.editReply({
                    content: `\\❌ Removed <@&${has!.id}>\n\\✅ Added <@&${
                        role.id
                    }>`
                });
            }
        } else {
            await (ctx.member as GuildMember).roles
                .add(role.id)
                .catch(() => {});
            return ctx.editReply({
                content: `\\✅ Added <@&${role.id}>`
            });
        }
    }
    return;
}
