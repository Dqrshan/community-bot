const { Listener } = require('@sapphire/framework');
const axios = require('axios');
const cheerio = require('cheerio');

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

		let gif = null;
		let reference = null;
		const regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;
		let url = msg.content.match(regex);
		if (/https?:\/\/tenor.com\/view\/[^ ]*/.test(url)) {
			const response = await axios.get(url[0]).catch(() => null);
			if (response) {
				const $ = cheerio.load(response.data);
				const src = $('meta[property="og:url"]', 'head').attr('content');
				if (src) gif = src;
			}
		} else if (url) {
			url = url[0];
			const response = await axios.get(url).catch(() => null);
			if (response) {
				const mimeType = response.headers['content-type'];
				if (mimeType.startsWith('image/')) gif = url;
			}
		}

		const attachments = [];
		if (gif) {
			attachments.push(gif);
		}

		if (msg.attachments.size) {
			msg.attachments.map((a) => attachments.push(a.proxyURL));
		}

		if (msg.reference) {
			reference = (await msg.fetchReference()).url;
		}

		await msg.client.data.snipes.set(msg.channelId, {
			message: msg.id,
			content: msg.content,
			author: msg.author.id,
			attachments,
			embeds: gif ? [] : msg.embeds.length ? msg.embeds.map((e) => e.toJSON()) : [],
			timestamp: Date.now(),
			reference
		});
	}
}

module.exports = { MessageDelete };
