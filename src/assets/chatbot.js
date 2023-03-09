const request = require('node-fetch');
const { URL, URLSearchParams } = require('url');

const mainURL = new URL(process.env.API_URL);

const urlOptions = {
	bid: process.env.BRAIN,
	key: process.env.API_KEY,
	uid: null,
	msg: null
};

const ChatBot = async (msg) => {
	msg.content = msg.content.replace(/^<@!?[0-9]{1,20}> ?/i, '');
	if (msg.content.length < 2) return;
	msg.channel.sendTyping();
	urlOptions.uid = msg.author.id;
	urlOptions.msg = msg.content;
	mainURL.search = new URLSearchParams(urlOptions).toString();
	try {
		let reply = await request(mainURL);
		if (reply) {
			reply = await reply.json();
			msg.reply({
				content: reply.cnt,
				allowedMentions: {
					repliedUser: false
				}
			});
		}
	} catch (e) {
		console.log(e.stack);
	}
};

module.exports = {
	ChatBot
};
