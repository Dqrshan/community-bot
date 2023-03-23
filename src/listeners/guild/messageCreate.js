const { Listener } = require('@sapphire/framework');
const { EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('pretty-ms');
const { Pagination } = require('../../lib/pagination');
const clever_chat = require('clever-chat');
const { tagPrefix } = require('../../config.json');
const emojiRegex = require('emoji-regex');

class MessageCreate extends Listener {
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
		// ignore bots / system / dms
		if (msg.author.bot || msg.author.system || !msg.guild) return;

		// afk check
		const data = await msg.client.data.afk.main.findOne({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => null);
		if (data) {
			const mentionData = await msg.client.data.mention.main
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
					mentionData
						.sort((x, y) => y.timestamp - x.timestamp)
						.map((v, i) => ({
							value: `\`${i + 1}\` <@!${v.member}>・[View](${v.msg}) (<t:${Math.round(v.timestamp / 1000)}:R>)`
						})),
					10
				);

				chunks.forEach((chunk) => {
					const embed = new EmbedBuilder()
						.setTitle(`Mentions (${mentionData.length})`)
						.setColor('#2F3136')
						.setDescription(`${chunk.map((e) => e.value).join('\n')}`);
					pages.push(embed);
				});

				const buttons = [
					new ButtonBuilder().setLabel('⬅️').setStyle(ButtonStyle.Secondary).setCustomId('_P'),
					new ButtonBuilder().setLabel('➡️').setStyle(ButtonStyle.Secondary).setCustomId('_N')
				];

				await Pagination(msg, content, pages, buttons);
				await msg.client.data.mention.main.destroy({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => {});
			} else {
				msg.reply({ content });
			}

			await msg.client.data.afk.main.destroy({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => {});
			if (msg.member.displayName.startsWith('[AFK]')) msg.member.setNickname(msg.member.displayName.replace('[AFK]', '')).catch(() => {});
		}

		// append mentions
		if (msg.mentions && msg.mentions.members && msg.mentions.members.size) {
			let id = null;
			msg.mentions.members.forEach(async (member) => {
				if (id === member.user.id) return;

				const data = await msg.client.data.afk.main.findOne({ where: { user: member.user.id, guild: msg.guildId } }).catch(() => null);
				if (data) {
					msg.reply({
						content: `**${member.displayName.replace('[AFK] ', '')}** is AFK: ${data.reason} - <t:${Math.round(data.timestamp / 1000)}:R>`
					});
					await msg.client.data.mention.main.upsert({
						guild: msg.guildId,
						user: member.user.id,
						member: msg.author.id,
						msg: msg.url,
						timestamp: Date.now()
					});

					id = member.user.id;
				}
			});
		}

		// chat bot
		if (msg.channel.name.includes('chatbot')) {
			try {
				if (!msg.content) return;
				if (msg.content.length < 2) return;
				msg.channel.sendTyping();
				const chatbot = new clever_chat({
					name: 'Rajalakshmi',
					gender: 'Female',
					developer_name: 'Darshan',
					language: 'en',
					user: msg.author.id
				});
				let res = await chatbot.chat(msg.content);
				res = res
					.replaceAll(/@everyone/g, 'everyone')
					.replaceAll(/@here/g, 'here')
					.replaceAll(/@&/g, '');
				msg.reply({ content: res }).catch(() => {});
			} catch (error) {
				msg.client.logger.error(error);
			}
		}

		// tag response
		if (msg.content.startsWith(tagPrefix)) {
			const users = msg.mentions.members
				? msg.mentions.members.map((m) => `<@!${m.user.id}>`).join(', ')
				: msg.reference
				? (await msg.fetchReference()).author
				: null;
			let trigger = msg.content.slice(tagPrefix.length);
			if (trigger.includes(' ')) trigger = trigger.split(' ')[0];
			const response = msg.client.data.tags.get(trigger);
			if (response) {
				msg.reply({
					content: `${users ? `*Tag suggestion for ${users}:*\n` : ''}${response}`
				});
				msg.client.logger.info(`Tag used by ${msg.author.tag}[${msg.author.id}]: "${trigger}"`);
			}
		}

		// polls
		if (msg.channel.name.includes('polls')) {
			const regex = emojiRegex();
			// default unicode emojis
			for (const match of msg.content.matchAll(regex)) {
				const emoji = match[0];
				await msg.react(emoji).catch(() => {});
			}
			// custom discord emojis
			for (const match of msg.content.matchAll(/\d{15,}/g)) {
				const eId = match[0];
				await msg.react(eId).catch(() => {});
			}
		}

		// run dokdo
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
	MessageCreate
};
