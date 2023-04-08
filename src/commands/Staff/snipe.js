const { Command } = require('@sapphire/framework');
const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

class SnipeCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			aliases: ['s'],
			description: 'Snipe deleted messages',
			preconditions: ['GuildOnly', 'StaffOnly']
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const index = await args.pick('integer').catch(() => 1);
		const channel = await args.pick('channel').catch(() => msg.channel);

		const snipes = msg.client.data.snipes.get(channel.id);
		if (!snipes) return msg.reply('Nothing to snipe!');

		const sniped = snipes[index - 1];
		if (!sniped) return msg.reply(`There are only ${snipes.length} deleted message(s) in the database`);

		const { message, content, author, attachments, embeds, timestamp, reference } = sniped;

		const user = await msg.client.users.fetch(author);
		const member = await msg.guild.members.fetch(user.id);
		const embed = new EmbedBuilder()
			.setColor('#2F3136')
			.setAuthor({
				name: user.tag,
				iconURL: user.displayAvatarURL()
			})
			.setThumbnail(member ? member.displayAvatarURL() : user.displayAvatarURL())
			.setTitle(`Deleted${channel.id === msg.channelId ? '' : ` in <#${channel.id}>`} <t:${Math.round(timestamp / 1000)}:R>`)
			.setFooter({
				text: `Message ID: ${message} | ${index}/${snipes.length}`
			});
		if (content) embed.setDescription(reference ? `╭ *replying to [message ↗️](${reference})*\n${content}` : content);
		if (attachments.length === 1) embed.setImage(attachments[0]);
		else if (attachments.length === 0) {
		} else
			embed.setFields({
				name: 'Attachments',
				value: attachments.length ? attachments.map((v, i) => `[${i + 1}](${v})`).join('・') : 'None'
			});

		const rawEs = [];
		embeds.forEach((em) => rawEs.push(new EmbedBuilder(em)));

		const link = new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(`https://discord.com/channels/${msg.guildId}/${channel.id}/${message}`)
			.setLabel('where was this message deleted?');

		const i = await msg
			.reply({
				embeds: [embed],
				components: [new ActionRowBuilder().setComponents(link)]
			})
			.catch(() => {});

		if (rawEs.length) {
			await i
				.reply({
					embeds: rawEs,
					content: 'Sniped Embeds'
				})
				.catch(() => {});
		}
	}
}

module.exports = { SnipeCommand };
