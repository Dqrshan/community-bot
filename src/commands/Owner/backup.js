const { Command } = require('@sapphire/framework');
const { stripIndents } = require('common-tags');
const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
	emojis: { dot }
} = require('../../config.json');

class BackupCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			flags: ['h'],
			preconditions: ['OwnerOnly']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const c = await args.getFlags('h');

		const file = new AttachmentBuilder('data/database.sqlite', { name: 'database.sqlite', description: new Date().toString() });

		if (c) {
			msg.reply({
				files: [file],
				content: `Backup ${new Date().toString()}`
			});
		} else {
			const m = await msg.author.send({
				files: [file],
				content: `Backup ${new Date().toString()}`
			});
			const comp = new ActionRowBuilder().setComponents(new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Jump!').setURL(m.url));
			await msg.reply({
				components: [comp],
				content: `Backup sent in DMs! ${new Date().toString()}`
			});
		}
	}
}

module.exports = {
	BackupCommand
};
