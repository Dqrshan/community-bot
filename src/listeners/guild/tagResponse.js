const { Listener } = require('@sapphire/framework');
const { tagPrefix } = require('../../config.json');

class TagResponse extends Listener {
	constructor(context, options = {}) {
		super(context, {
			...options,
			event: 'messageCreate'
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 */
	async run(msg) {
		if (msg.author.bot || msg.webhookId || msg.system) return;

		if (msg.content.startsWith(tagPrefix)) {
			const trigger = msg.content.slice(tagPrefix.length);
			const response = msg.client.data.tags.get(trigger);
			if (response) msg.reply(response);
		}
	}
}

module.exports = {
	TagResponse
};
