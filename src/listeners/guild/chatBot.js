const { Listener } = require('@sapphire/framework');
const { ChatBot } = require('../../assets/chatbot');

class ChatEvent extends Listener {
	constructor(context, options) {
		super(context, {
			...options,
			event: 'messageCreate'
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 */
	async run(msg) {
		if (msg.author.bot) return;
		if (msg.system) return;
		if (!msg.guild) return;

		if (msg.channel.name.includes('chatbot')) {
			await ChatBot(msg);
		}
	}
}

module.exports = { ChatEvent };
