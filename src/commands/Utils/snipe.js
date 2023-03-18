const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

class SnipeCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			aliases: ['s'],
			description: 'Snipe deleted messages',
			preconditions: ['GuildOnly']
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const index = await args.pick('integer').catch(() => 1);

		const snipes = msg.client.data.snipes.get(msg.channelId);
		if (!snipes) return msg.reply('Nothing to snipe!');

		const sniped = snipes[index - 1];
		if (!sniped) return msg.reply(`There are only ${snipes.length} deleted message(s) in the database`);

		const { message, content, author, attachments, embeds, timestamp } = sniped;

		const user = await msg.client.users.fetch(author);
		const member = await msg.guild.members.fetch(user.id);
		const embed = new EmbedBuilder()
			.setColor('#2F3136')
			.setAuthor({
				name: user.tag,
				iconURL: user.displayAvatarURL()
			})
			.setThumbnail(member ? member.displayAvatarURL() : user.displayAvatarURL())
			.setTitle(`Deleted <t:${Math.round(timestamp / 1000)}:R>`)
			.setFooter({
				text: `Message ID: ${message} | ${index}/${snipes.length}`
			});
		if (content) embed.setDescription(content);
		if (attachments.length === 1) embed.setImage(attachments[0]);
		else if (attachments.length === 0) {
		} else
			embed.setFields({
				name: 'Attachments',
				value: attachments.length ? attachments.map((v, i) => `[${i + 1}](${v})`).join('・') : 'None'
			});

		const rawEs = [];
		embeds.forEach((em) => rawEs.push(new EmbedBuilder(em)));

		await msg.reply({
			embeds: [embed]
		});

		if (rawEs.length) {
			msg.channel.send({
				embeds: rawEs,
				content: 'Sniped Embeds'
			});
		}
	}
}

module.exports = { SnipeCommand };
