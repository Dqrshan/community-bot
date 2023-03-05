const { Command } = require('@sapphire/framework');
const { stripIndents } = require('common-tags');
const { EmbedBuilder } = require('discord.js');

class MembersCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'View detailed member count of the server',
			aliases: ['mc', 'membercount']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 */
	async messageRun(msg) {
		const humans = (await msg.guild.members.fetch()).filter((m) => !m.user.bot).size;
		const bots = (await msg.guild.members.fetch()).filter((m) => m.user.bot).size;

		const embed = new EmbedBuilder()
			.setTitle('Member Count')
			.setThumbnail(msg.guild.iconURL())
			.setDescription(
				stripIndents`
            Total・**${msg.guild.memberCount.toLocaleString()}**
            Humans・**${humans.toLocaleString()}**
            Bots・**${bots.toLocaleString()}**
            `
			)
			.setColor('#2F3136');

		return msg.reply({
			embeds: [embed]
		});
	}
}

module.exports = {
	MembersCommand
};
