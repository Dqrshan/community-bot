const { Command } = require('@sapphire/framework');
const { stripIndents } = require('common-tags');
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Pagination } = require('../../lib/pagination');

class AfkCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'Sets your AFK status',
			preconditions: ['GuildOnly'],
			flags: ['list']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		if (await args.getFlags('list')) {
			if (!msg.member.permissions.has('Administrator')) return;

			const afkData = await msg.client.data.afk.main.findAll({ where: { guild: msg.guildId } }).catch(() => null);
			if (!afkData) return msg.reply({ content: 'No data found!' });

			const data = afkData
				.sort((x, y) => y.timestamp - x.timestamp)
				.map((v, i) => ({
					value: `\`${i + 1}\` <@!${v.user}>・"${v.reason}" (<t:${Math.round(v.timestamp / 1000)}:R>)`
				}));
			const pages = [];
			const chunks = this.chunkify(data, 10);
			chunks.forEach((chunk) => {
				const embed = new EmbedBuilder()
					.setTitle('AFK List')
					.setThumbnail(msg.guild.iconURL())
					.setColor('Blurple')
					.setDescription(chunk.map((e) => e.value).join('\n'));
				pages.push(embed);
			});
			const buttons = [
				new ButtonBuilder().setLabel('⬅️').setStyle(ButtonStyle.Secondary).setCustomId('_I'),
				new ButtonBuilder().setLabel('➡️').setStyle(ButtonStyle.Secondary).setCustomId('_J')
			];
			await Pagination(msg, null, pages, buttons);
			return;
		}

		// normal afk set
		const data = await msg.client.data.afk.main.findOne({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => null);

		if (!data) {
			let reason = await args.rest('string').catch(() => 'AFK');
			if (reason.length > 500) {
				msg.reply({ content: 'Reason cannot exceed `500` chars' });
				return;
			}
			reason = reason
				.replaceAll(/@everyone/g, 'everyone')
				.replaceAll(/@here/g, 'here')
				.replaceAll(/@&/g, '');
			msg.reply({ content: `You are now AFK. Reason: ${reason}` });
			if (!msg.member.displayName.startsWith('[AFK]')) msg.member.setNickname(`[AFK] ${msg.member.displayName}`).catch(() => {});

			await msg.client.data.afk.main.upsert({
				user: msg.author.id,
				guild: msg.guildId,
				reason,
				timestamp: Date.now()
			});
		} else {
			msg.reply('You are already AFK!');
		}
	}

	/**
	 *
	 * @param {Array} arr
	 * @param {number} len
	 */
	chunkify(arr, len) {
		const chunks = [];
		let i = 0;
		const n = arr.length;
		while (i < n) {
			chunks.push(arr.slice(i, (i += len)));
		}
		return chunks;
	}
}

module.exports = {
	AfkCommand
};
