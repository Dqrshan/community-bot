import {
    EmbedBuilder,
    MessageFlags,
    TextChannel,
    type GuildMember,
    type Interaction
} from "discord.js";
import { gradeRoles, schoolRoles, suggestionsCh } from "../config";
import { askReasonForTicket, createTicket, deleteTicket } from "../lib/Ticket";
import { errorEmbed, infoEmbed, successEmbed } from "../lib/response";
import {
    countVotes,
    findSuggestion,
    findVote,
    removeVote,
    upsertVote
} from "../lib/db";
import { DOT } from "../lib/response";

export default async function run(ctx: Interaction) {
    if (ctx.user.bot || ctx.user.system || !ctx.guild) return;

    // ticketing
    if (ctx.isButton() && ctx.customId === "NEW")
        return askReasonForTicket(ctx);

    if (ctx.isModalSubmit() && ctx.customId === "CREATE_TICKET")
        return await createTicket(ctx);

    if (ctx.isButton() && ctx.customId === "CLOSE") return deleteTicket(ctx);

    // suggestion voting
    if (
        ctx.isButton() &&
        (ctx.customId.startsWith("su_") || ctx.customId.startsWith("sd_"))
    ) {
        await ctx
            .deferReply({
                flags: MessageFlags.Ephemeral,
                fetchReply: true
            })
            .catch(() => {});
        try {
            const [, guildId, idRaw] = ctx.customId.split("_");
            const id = parseInt(idRaw);
            const upvoted = ctx.customId.startsWith("su_");
            const vote = upvoted ? 1 : -1;

            const row = await findSuggestion(guildId, id);
            if (!row || row.status !== "pending") {
                return ctx.editReply({
                    embeds: [infoEmbed("This suggestion is no longer open for votes.")]
                });
            }

            const current = await findVote(guildId, id, ctx.user.id);
            if (current === vote) {
                await removeVote(guildId, id, ctx.user.id);
            } else {
                await upsertVote(guildId, id, ctx.user.id, vote);
            }
            const counts = await countVotes(guildId, id);

            const channel = ctx.guild.channels.cache.get(
                suggestionsCh
            ) as TextChannel | undefined;
            if (channel && row.message) {
                const posted = await channel.messages
                    .fetch(row.message)
                    .catch(() => null);
                if (posted) {
                    const embed = EmbedBuilder.from(posted.embeds[0].data);
                    const fields = (embed.data.fields ?? []).filter(
                        (f) => f.name !== "Votes"
                    );
                    fields.push({
                        name: "Votes",
                        value: `Upvotes ${DOT} ${counts.up}\nDownvotes ${DOT} ${counts.down}`,
                        inline: false
                    });
                    embed.setFields(fields);
                    await posted.edit({ embeds: [embed] }).catch(() => {});
                }
            }

            const reply =
                current === vote
                    ? "Your vote was removed."
                    : upvoted
                    ? "You upvoted this suggestion."
                    : "You downvoted this suggestion.";

            return ctx.editReply({ embeds: [infoEmbed(reply)] });
        } catch (error) {
            console.error(error);
            return ctx
                .editReply({ embeds: [errorEmbed("The vote could not be counted.")] })
                .catch(() => {});
        }
    }

    const member = ctx.member as GuildMember;

    // self-assignable roles (toggle)
    if (ctx.isButton()) {
        if (ctx.customId.startsWith("a-") || ctx.customId.startsWith("p-")) {
            await ctx.deferReply({
                flags: MessageFlags.Ephemeral,
                fetchReply: true
            });
            const id = ctx.customId.replace("a-", "").replace("p-", "");
            const role = ctx.guild.roles.cache.get(id);
            if (!role) {
                return ctx.editReply({
                    embeds: [errorEmbed("I couldn't find that role.")]
                });
            }
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role.id).catch(() => {});
                return ctx.editReply({
                    embeds: [infoEmbed(`Removed <@&${role.id}>`)]
                });
            }
            await member.roles.add(role.id).catch(() => {});
            return ctx.editReply({
                embeds: [successEmbed(`Added <@&${role.id}>`)]
            });
        }

        // grade roles (single choice)
        if (ctx.customId.startsWith("g-")) {
            await ctx.deferReply({
                flags: MessageFlags.Ephemeral,
                fetchReply: true
            });
            const id = ctx.customId.replace("g-", "");
            const role = ctx.guild.roles.cache.get(id);
            if (!role) {
                return ctx.editReply({
                    embeds: [errorEmbed("I couldn't find that role.")]
                });
            }
            const grades = gradeRoles.map((d) => d.role);
            if (
                member.roles.cache.some((r) => grades.includes(r.id))
            ) {
                return ctx.editReply({
                    embeds: [
                        errorEmbed(
                            "You already have a grade role. Open a ticket to have it changed."
                        )
                    ]
                });
            }
            await member.roles.add(role.id).catch(() => {});
            return ctx.editReply({
                embeds: [successEmbed(`Added <@&${role.id}>`)]
            });
        }
    }

    // school roles (single choice, via select menu)
    if (ctx.isStringSelectMenu() && ctx.customId === "SCHOOL") {
        await ctx.deferReply({
            flags: MessageFlags.Ephemeral,
            fetchReply: true
        });
        if (
            member.roles.cache.some((r) =>
                r.name.toLowerCase().includes("alumnus")
            )
        ) {
            return ctx.editReply({
                embeds: [errorEmbed("You cannot add a school role.")]
            });
        }
        const [value] = ctx.values;
        const role = ctx.guild.roles.cache.get(value);
        if (!role) {
            return ctx.editReply({
                embeds: [errorEmbed("I couldn't find that role.")]
            });
        }

        const current = member.roles.cache.find((r) =>
            schoolRoles.includes(r.id)
        );

        if (current) {
            if (current.id === role.id) {
                await member.roles.remove(current.id).catch(() => {});
                return ctx.editReply({
                    embeds: [infoEmbed(`Removed <@&${current.id}>`)]
                });
            }
            await member.roles.remove(current.id).catch(() => {});
            await member.roles.add(role.id).catch(() => {});
            return ctx.editReply({
                embeds: [
                    infoEmbed(
                        `Removed <@&${current.id}>\nAdded <@&${role.id}>`
                    )
                ]
            });
        }

        await member.roles.add(role.id).catch(() => {});
        return ctx.editReply({
            embeds: [successEmbed(`Added <@&${role.id}>`)]
        });
    }
}
