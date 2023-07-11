import { EmbedBuilder, Message } from 'discord.js';
import { Command } from '../../lib/command';
import { stripIndents } from 'common-tags';

const members: Command = {
	name: 'members',
	description: 'View detailed member count of this server',
	aliases: ['mc', 'membercount'],
	messageRun: async (msg: Message) => {
		const humans = (await msg.guild!.members.fetch()).filter(
			(m) => !m.user.bot
		).size;
		const bots = (await msg.guild!.members.fetch()).filter(
			(m) => m.user.bot
		).size;

		const embed = new EmbedBuilder()
			.setTitle('Member Count')
			.setThumbnail(msg.guild!.iconURL())
			.setDescription(
				stripIndents`
            Total・**${msg.guild!.memberCount.toLocaleString()}**
            Humans・**${humans.toLocaleString()}**
            Bots・**${bots.toLocaleString()}**
            `
			)
			.setColor('#2F3136');

		return msg.reply({
			embeds: [embed],
		});
	},
};

export default members;
