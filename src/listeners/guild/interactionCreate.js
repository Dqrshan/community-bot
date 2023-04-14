const { Listener } = require('@sapphire/framework');
const {
	roles: { grade, school }
} = require('../../config.json');

const styles = ['primary', 'secondary', 'success', 'danger'];

class InteractionCreate extends Listener {
	constructor(context, options) {
		super(context, {
			...options
		});
	}

	/**
	 *
	 * @param {import('discord.js').ButtonInteraction | import('discord.js').StringSelectMenuInteraction} ctx
	 */
	async run(ctx) {
		if (ctx.user.bot || ctx.user.system || !ctx.guild) return;

		if (ctx.isButton()) {
			if (styles.includes(ctx.customId)) {
				await ctx.deferReply({ ephemeral: true, fetchReply: true }).catch(() => {});

				await ctx.editReply({ content: 'lorenz is cool 😎' }).catch(() => {});
				return;
			}

			if (ctx.customId.startsWith('a-') || ctx.customId.startsWith('p-')) {
				await ctx.deferReply({ ephemeral: true, fetchReply: true }).catch(() => {});
				const id = ctx.customId.replace('a-', '').replace('p-', '');
				const role = ctx.guild.roles.cache.get(id);
				if (!role) {
					await ctx
						.editReply({
							content: 'I cannot seem to find that role..'
						})
						.catch(() => {});
					return;
				}
				if (ctx.member.roles.cache.has(role.id)) {
					ctx.member.roles.remove(role.id).catch(() => {});
					await ctx
						.editReply({
							content: `\\❌ Removed <@&${role.id}>!`
						})
						.catch(() => {});
					return;
				} else {
					ctx.member.roles.add(role.id).catch(() => {});
					await ctx
						.editReply({
							content: `\\✅ Added <@&${role.id}>!`
						})
						.catch(() => {});
					return;
				}
			} else if (ctx.customId.startsWith('g-')) {
				await ctx.deferReply({ ephemeral: true, fetchReply: true }).catch(() => {});
				const id = ctx.customId.replace('g-', '');
				const role = ctx.guild.roles.cache.get(id);
				if (!role) {
					await ctx
						.editReply({
							content: 'I cannot seem to find that role..'
						})
						.catch(() => {});
					return;
				}
				const grades = grade.map((d) => d.role);
				if (ctx.member.roles.cache.some((r) => grades.includes(r.id))) {
					await ctx
						.editReply({
							content: 'You already have a grade role! Please open a ticket in <#1031159883673911336> to change.'
						})
						.catch(() => {});
					return;
				} else {
					ctx.member.roles.add(role.id).catch(() => {});
					await ctx
						.editReply({
							content: `\\✅ Added <@&${role.id}>!`
						})
						.catch(() => {});
					return;
				}
			}
		}

		if (ctx.isStringSelectMenu() && ctx.customId === 'SCHOOL') {
			await ctx.deferReply({ ephemeral: true, fetchReply: true }).catch(() => {});
			if (ctx.member.roles.cache.some((r) => r.name.toLowerCase().includes('alumnus'))) {
				await ctx.editReply({
					content: 'You cannot add school roles!'
				});
				return;
			}
			const [value] = ctx.values;
			const role = ctx.guild.roles.cache.get(value);
			if (!role) {
				await ctx
					.editReply({
						content: 'I cannot seem to find that role..'
					})
					.catch(() => {});
				return;
			}

			if (ctx.member.roles.cache.some((r) => school.includes(r.id))) {
				const has = ctx.member.roles.cache.find((r) => school.includes(r.id));
				if (has.id === role.id) {
					await ctx.member.roles.remove(has.id).catch(() => {});

					return ctx.editReply({
						content: `\\❌ Removed <@&${has.id}>`
					});
				} else {
					await ctx.member.roles.remove(has.id).catch(() => {});
					await ctx.member.roles.add(role.id).catch(() => {});

					return ctx.editReply({
						content: `\\❌ Removed <@&${has.id}>\n\\✅ Added <@&${role.id}>`
					});
				}
			} else {
				await ctx.member.roles.add(role.id).catch(() => {});
				return ctx.editReply({
					content: `\\✅ Added <@&${role.id}>`
				});
			}
		}
	}
}

module.exports = { InteractionCreate };
