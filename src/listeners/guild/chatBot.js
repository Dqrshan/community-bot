const { Listener } = require('@sapphire/framework');
const clever_chat = require('clever-chat');

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
	}
}

module.exports = { ChatEvent };
