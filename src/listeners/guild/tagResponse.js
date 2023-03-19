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
	}
}

module.exports = {
	TagResponse
};
