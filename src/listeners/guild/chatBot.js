const { Listener } = require('@sapphire/framework');
const { Client } = require('smartestchatbot');

const Chat = new Client(process.env.LEBYY_API);

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

		// if (msg.channel.name.includes('chatbot')) {
		if (msg.channelId === '926319580790550578') {
			try {
				if (!msg.content) return;
				if (msg.content.length < 2) return;
				msg.channel.sendTyping();

				const res = await Chat.chat(
					{
						message: msg.content,
						name: 'Rajalakshmi',
						master: 'Darshan',
						user: msg.author.id,
						age: '420',
						birthday: 'September 25',
						gender: 'female',
						boyfriend: 'Lorenz',
						girlfriend: 'Lorenz',
						nationality: 'Indian',
						country: 'India',
						birthplace: 'Bangalore',
						state: 'Karnataka',
						location: 'India',
						email: 'no',
						website: 'https://darshan-1.gitbook.io/bangalore-hub/',
						sign: 'Libra',
						friend: 'Lorenz',
						mother: 'Vijaylakshmi'
					},
					'en'
				);

				msg.reply({ content: res });
			} catch (error) {
				msg.client.logger.error(error);
			}
		}
	}
}

module.exports = { ChatEvent };
