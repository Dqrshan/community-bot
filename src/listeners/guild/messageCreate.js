const { Listener } = require('@sapphire/framework');
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('pretty-ms');
const { Pagination } = require('../../assets/pagination');

class UserEvent extends Listener {
	constructor(context, options = {}) {
		super(context, {
			...options
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 */
	async run(msg) {
		if (msg.author.bot || msg.author.system) return;
		const data = await msg.client.data.afk.raw.findOne({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => null);
		if (data) {
			const mentionData = await msg.client.data.mention.raw
				.findAll({
					where: {
						user: msg.author.id,
						guild: msg.guildId
					}
				})
				.catch(() => null);
			const content = `Welcome back! You were afk for ${ms(Date.now() - data.timestamp, { verbose: true, compact: true })}`;
			if (mentionData && mentionData.length) {
				const pages = [];
				const chunks = this.chunkify(
					mentionData.map((v, i) => ({
						value: `\`${i + 1}\` <@!${v.member}>・[view msg](${v.msg})`
					})),
					10
				);

				chunks.forEach((chunk) => {
					const embed = new EmbedBuilder()
						.setTitle('Mentions')
						.setColor('#2F3136')
						.setDescription(`${chunk.map((e) => e.value).join('\n')}`);
					pages.push(embed);
				});

				const buttons = [
					new ButtonBuilder().setLabel('⬅️').setStyle(ButtonStyle.Secondary).setCustomId('_P'),
					new ButtonBuilder().setLabel('➡️').setStyle(ButtonStyle.Secondary).setCustomId('_N')
				];

				await Pagination(msg, content, pages, buttons);
				await msg.client.data.mention.raw.destroy({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => {});
			} else {
				msg.reply({ content });
			}

			await msg.client.data.afk.raw.destroy({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => {});
		}
		if (msg.mentions.members.size) {
			msg.mentions.members.forEach(async (member) => {
				const data = await msg.client.data.afk.raw.findOne({ where: { user: member.user.id, guild: msg.guildId } }).catch(() => null);
				if (data) {
					msg.reply({
						content: `**${member.displayName}** is AFK: ${data.reason} - <t:${Math.round(data.timestamp / 1000)}:R>`
					});
					await msg.client.data.mention.raw.upsert({
						guild: msg.guildId,
						user: member.user.id,
						member: msg.author.id,
						msg: msg.url
					});
				}
			});
		}
		try {
			this.container.client.dokdo.run(msg);
		} catch (e) {
			this.container.client.logger.fatal(e);
		}
	}

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
	UserEvent
};
