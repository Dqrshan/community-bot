const { Command } = require('@sapphire/framework');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

class RawCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			aliases: ['source'],
			description: 'Returns the raw JSON of given message',
			preconditions: ['OwnerOnly'],
			flags: ['clean', 'c']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const m = await args.pick('message').catch(async () => (msg.reference?.messageId ? await msg.fetchReference() : null));
		if (!m) return msg.reply('Please provide a message to get the source of.');

		const raw = {
			content: m.content,
			embeds: m.embeds.map((e) => e.toJSON()),
			components: m.components.map((c) => c.toJSON()),
			attachments: m.attachments.map((a) => a.toJSON()),
			stickers: m.stickers.map((s) => s.toJSON()),
			reactions: m.reactions.cache.map((r) => r.toJSON())
		};

		const json = JSON.stringify(args.getFlags('clean', 'c') ? this.clean(raw) : raw, null, '\t');

		return msg.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle('Raw JSON')
					.addFields(
						{ name: 'Source', value: `[Jump](${m.url})`, inline: true },
						{ name: 'Cleaned?', value: `${args.getFlags('clean')}`, inline: true },
						{ name: 'Length', value: `${json.length} chars`, inline: true }
					)
					.setColor('#2F3136')
			],
			files: [
				new AttachmentBuilder(Buffer.from(json), {
					name: `${m.id}.json`
				})
			]
		});
	}

	clean(object) {
		Object.entries(object).forEach(([k, v]) => {
			if (v && typeof v === 'object') {
				this.clean(v);
			}
			if (
				(v && typeof v === 'object' && !Object.keys(v).length) ||
				v === null ||
				v === undefined ||
				['type', 'components', 'proxyURL', 'height', 'width'].includes(k)
			) {
				if (Array.isArray(object)) {
					object.splice(parseInt(k), 1);
				} else {
					delete object[k];
				}
			}
		});
		return object;
	}
}

module.exports = {
	RawCommand
};
