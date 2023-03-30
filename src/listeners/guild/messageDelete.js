const { Listener } = require('@sapphire/framework');

class MessageDelete extends Listener {
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
		if (msg.system || msg.author.bot || msg.webhookId || !msg.guild) return;

		await msg.client.data.snipes.set(msg.channelId, {
			message: msg.id,
			content: msg.content,
			author: msg.author.id,
			attachments: msg.attachments.size === 0 ? [] : msg.attachments.map((a) => a.proxyURL),
			embeds: msg.embeds.length ? msg.embeds.map((e) => e.toJSON()) : [],
			timestamp: Date.now()
		});
	}
}

module.exports = { MessageDelete };
