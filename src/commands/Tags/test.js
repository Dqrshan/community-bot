const { Command } = require('@sapphire/framework');
const { stripIndents } = require('common-tags');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const {
	roles: { activity, grade, school }
} = require('../../config.json');

class TestCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			preconditions: ['OwnerOnly']
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const base = new EmbedBuilder()
			.setColor('Blurple')
			.setImage(`https://singlecolorimage.com/get/5865f2/320x20`)
			.setThumbnail(msg.guild.iconURL());
		const e1 = EmbedBuilder.from(base)
			.setTitle('Grade Roles')
			.setDescription(grade.map((r) => `${this.getEmoji(msg, r.emoji)}・<@&${r.role}>`).join('\n'))
			.setFooter({
				text: 'You can only select one role, open a ticket to change',
				iconURL: 'https://www.iconsdb.com/icons/preview/color/5865F2/info-3-xxl.png'
			});

		const e2 = EmbedBuilder.from(base)
			.setTitle('Activity Roles')
			.setDescription(activity.map((r) => `${this.getEmoji(msg, r.emoji)}・<@&${r.role}>`).join('\n'))
			.setFooter({
				text: 'You can select multiple roles',
				iconURL: 'https://www.iconsdb.com/icons/preview/color/5865F2/info-3-xxl.png'
			});

		const e3 = EmbedBuilder.from(base)
			.setTitle('School Roles')
			.setImage(`https://singlecolorimage.com/get/5865f2/369x20`)
			.setDescription("Pick your school roles below! If your school role isn't shown, open a ticket in <#1031159883673911336>.");

		const b1 = grade.map((r) => new ButtonBuilder().setEmoji(r.emoji).setLabel(' ').setCustomId(`g-${r.role}`).setStyle(ButtonStyle.Secondary));
		const b12 = b1.pop();

		const b2 = activity.map((r) =>
			new ButtonBuilder().setEmoji(r.emoji).setLabel(' ').setCustomId(`a-${r.role}`).setStyle(ButtonStyle.Secondary)
		);

		const menu = new StringSelectMenuBuilder()
			.setPlaceholder('Select your school role..')
			.setCustomId('SCHOOL')
			.addOptions(
				school.map((r) => {
					return {
						label: `${this.getRoleName(msg, r)}`,
						value: r
					};
				})
			);

		await msg.channel.send({
			embeds: [e1],
			components: [new ActionRowBuilder().setComponents(b1), new ActionRowBuilder().setComponents(b12)]
		});
		await msg.channel.send({
			embeds: [e2],
			components: [new ActionRowBuilder().setComponents(b2)]
		});
		await msg.channel.send({
			embeds: [e3],
			components: [new ActionRowBuilder().setComponents(menu)]
		});
	}

	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {string} id
	 */
	getEmoji(msg, id) {
		if (id.length <= 3) return id;
		const e = msg.client.emojis.cache.get(id);
		return `<:${e.name}:${e.id}>`;
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {string} role
	 */
	getRoleName(msg, role) {
		return msg.guild.roles.cache.get(role).name;
	}
	/**
	 *
	 * @param {string} s
	 */
	parseId(s) {
		return s.slice(0, Math.round(s.length / 2));
	}
}

module.exports = {
	TestCommand
};
