import {
    MessageFlags,
    TextChannel,
    type GuildMember,
    type Interaction
} from "discord.js";
import { gradeRoles, schoolRoles, suggestionsCh } from "../config";
import { askReasonForTicket, createTicket, deleteTicket } from "../lib/Ticket";
import { editV2, statusContainer, V2 } from "../lib/components";
import {
    countPollVotes,
    countVotes,
    findPoll,
    findPollVote,
    findSuggestion,
    findVote,
    removePollVote,
    removeVote,
    setPollVote,
    upsertVote
} from "../lib/db";
import { pollCard } from "../lib/pollCard";
import { suggestionCard } from "../lib/suggestionCard";

const ephemeral = (kind: "info" | "success" | "error", body: string) => ({
    components: [statusContainer(kind, body)],
    flags: V2 | MessageFlags.Ephemeral
});

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
                return ctx.editReply(
                    ephemeral("info", "This suggestion is no longer open for votes.")
                );
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
                    await editV2(
                        posted,
                        [suggestionCard(row, counts)],
                        { allowedMentions: { parse: [] } }
                    ).catch(() => {});
                }
            }

            const reply =
                current === vote
                    ? "Your vote was removed."
                    : upvoted
                    ? "You upvoted this suggestion."
                    : "You downvoted this suggestion.";

            return ctx.editReply(ephemeral("info", reply));
        } catch (error) {
            console.error(error);
            return ctx
                .editReply(
                    ephemeral("error", "The vote could not be counted.")
                )
                .catch(() => {});
        }
    }

    // poll voting
    if (ctx.isButton() && ctx.customId.startsWith("poll_")) {
        await ctx
            .deferReply({
                flags: MessageFlags.Ephemeral,
                fetchReply: true
            })
            .catch(() => {});
        try {
            const [, key, raw] = ctx.customId.split("_");
            const option = parseInt(raw);
            const poll = await findPoll(key);
            if (!poll) {
                return ctx.editReply(
                    ephemeral("info", "This poll is no longer available.")
                );
            }

            const options: string[] = JSON.parse(poll.options);
            if (isNaN(option) || option < 0 || option >= options.length) {
                return ctx.editReply(
                    ephemeral("error", "That poll option doesn't exist.")
                );
            }

            const current = await findPollVote(key, ctx.user.id);
            if (current === option) {
                await removePollVote(key, ctx.user.id);
            } else {
                await setPollVote(key, ctx.user.id, option);
            }

            const { counts, voters } = await countPollVotes(
                key,
                options.length
            );
            const channel = ctx.guild.channels.cache.get(
                poll.channel
            ) as TextChannel | undefined;
            const posted =
                channel && poll.message
                    ? await channel.messages
                          .fetch(poll.message)
                          .catch(() => null)
                    : null;

            if (posted) {
                await editV2(
                    posted,
                    [pollCard(poll, counts, voters)],
                    { allowedMentions: { parse: [] } }
                ).catch(() => {});
            }

            return ctx.editReply(
                ephemeral(
                    "info",
                    current === option
                        ? "Your vote was removed."
                        : `You voted for **${options[option]}**.`
                )
            );
        } catch (error) {
            console.error(error);
            return ctx
                .editReply(
                    ephemeral("error", "The vote could not be counted.")
                )
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
                return ctx.editReply(
                    ephemeral("error", "I couldn't find that role.")
                );
            }
            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role.id).catch(() => {});
                return ctx.editReply(
                    ephemeral("info", `Removed <@&${role.id}>`)
                );
            }
            await member.roles.add(role.id).catch(() => {});
            return ctx.editReply(
                ephemeral("success", `Added <@&${role.id}>`)
            );
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
                return ctx.editReply(
                    ephemeral("error", "I couldn't find that role.")
                );
            }
            const grades = gradeRoles.map((d) => d.role);
            if (member.roles.cache.some((r) => grades.includes(r.id))) {
                return ctx.editReply(
                    ephemeral(
                        "error",
                        "You already have a grade role. Open a ticket to have it changed."
                    )
                );
            }
            await member.roles.add(role.id).catch(() => {});
            return ctx.editReply(
                ephemeral("success", `Added <@&${role.id}>`)
            );
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
            return ctx.editReply(
                ephemeral("error", "You cannot add a school role.")
            );
        }
        const [value] = ctx.values;
        const role = ctx.guild.roles.cache.get(value);
        if (!role) {
            return ctx.editReply(
                ephemeral("error", "I couldn't find that role.")
            );
        }

        const current = member.roles.cache.find((r) =>
            schoolRoles.includes(r.id)
        );

        if (current) {
            if (current.id === role.id) {
                await member.roles.remove(current.id).catch(() => {});
                return ctx.editReply(
                    ephemeral("info", `Removed <@&${current.id}>`)
                );
            }
            await member.roles.remove(current.id).catch(() => {});
            await member.roles.add(role.id).catch(() => {});
            return ctx.editReply(
                ephemeral(
                    "info",
                    `Removed <@&${current.id}>\nAdded <@&${role.id}>`
                )
            );
        }

        await member.roles.add(role.id).catch(() => {});
        return ctx.editReply(
            ephemeral("success", `Added <@&${role.id}>`)
        );
    }
}
