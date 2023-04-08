const { Command } = require('@sapphire/framework');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class ButtonsCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'View all discord buttons [kinda cool]',
			aliases: ['btns'],
			preconditions: ['GuildOnly']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 */
	async messageRun(msg) {
		const b1 = new ButtonBuilder().setLabel('Primary').setStyle(ButtonStyle.Primary).setCustomId('primary');
		const b2 = new ButtonBuilder().setLabel('Secondary').setStyle(ButtonStyle.Secondary).setCustomId('secondary');
		const b3 = new ButtonBuilder().setLabel('Success').setStyle(ButtonStyle.Success).setCustomId('success');
		const b4 = new ButtonBuilder().setLabel('Danger').setStyle(ButtonStyle.Danger).setCustomId('danger');
		const b5 = new ButtonBuilder().setLabel('Link').setStyle(ButtonStyle.Link).setURL('https://discord.gg/bangalore');

		return msg.reply({
			content: 'These are the 5 different types of discord buttons',
			components: [new ActionRowBuilder().setComponents(b1, b2, b3, b4, b5)]
		});
	}
}

module.exports = {
	ButtonsCommand
};
