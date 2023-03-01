const { Command } = require('@sapphire/framework');
const { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const {
	emojis: { dot },
	links: { links, rules }
} = require('../../config.json');

class TicketCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'Sends the ticket embed (tag response)',
			preconditions: ['StaffOnly']
		});
	}
	/**
	 *
	 * @param {Message} msg
	 */
	async messageRun(msg) {
		if (!msg.channel.name.includes('ticket')) return msg.reply('This command can only be used in tickets');
		const embed = new EmbedBuilder().setColor('Blurple').setDescription(`${dot} Please describe your problem`);
		const buttons = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setLabel('Rules').setStyle(ButtonStyle.Link).setURL(rules),
			new ButtonBuilder().setLabel('Links').setStyle(ButtonStyle.Link).setURL(links)
		);
		msg.channel.send({ embeds: [embed], components: [buttons] });
		await msg.delete().catch(() => {});
	}
}

module.exports = {
	TicketCommand
};
