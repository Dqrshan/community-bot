const { Listener } = require('@sapphire/framework');
const ms = require('pretty-ms');

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
		const data = await msg.client.data.afk.raw.findOne({ where: { user: msg.author.id } }).catch(() => null);
		if (data) {
			msg.reply(`Welcome back! You were afk for ${ms(Date.now() - data.timestamp, { verbose: true, compact: true })}`);
			await msg.client.data.afk.raw.destroy({ where: { user: msg.author.id } }).catch(() => {});
		}
		if (msg.mentions.members.size) {
			msg.mentions.members.forEach(async (member) => {
				const data = await msg.client.data.afk.raw.findOne({ where: { user: member.user.id } }).catch(() => null);
				if (data) {
					msg.reply({
						content: `**${member.displayName}** is AFK: ${data.reason} - <t:${Math.round(data.timestamp / 1000)}:R>`
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
}

module.exports = {
	UserEvent
};
