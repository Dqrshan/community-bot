const { Command } = require('@sapphire/framework');
const { reply } = require('@sapphire/plugin-editable-commands');
const { stripIndents } = require('common-tags');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class RuleCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'Rule tags',
			aliases: ['rules', 'r'],
			cooldownDelay: 5000
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const button = new ActionRowBuilder().setComponents(
			new ButtonBuilder()
				.setLabel('Rules')
				.setStyle(ButtonStyle.Link)
				.setURL('https://discord.com/channels/1023702510730494012/1075735310736035900/1075737635408072794')
		);

		const n = await args.pick('integer').catch(() => null);
		const keyword = await args.pick('string').catch(() => null);

		if (!n && !keyword) return reply(msg, { components: [button] });

		const keys = this.rules().map((m) => m.rule);
		const user = msg.reference ? (await msg.channel.messages.fetch(msg.reference.messageId)).author : null;
		let content = user ? `*Tag suggestion for <@!${user.id}>*:\n` : '';

		if (keyword) {
			const rule = this.rules().find((e) => e.content.toLowerCase().includes(keyword));
			if (rule) {
				content += rule.content;
			} else {
				content = "Couldn't find what you were looking for!";
			}
		} else {
			if (n && keys.includes(n)) {
				content += this.rules().find((e) => e.rule === n).content;
			} else {
				content = "Couldn't find what you were looking for!";
			}
		}

		return reply(msg, {
			components: [button],
			content
		});
	}

	rules() {
		return [
			{
				rule: 1,
				content: stripIndents`
            	**Rule 1**・Be respectful and civil. We have absolutely zero tolerance for any racism, sexism, hate speech, or any other offensive/disruptive behaviour. This applies to voice chats as well. The use of profanity should be kept to a minimum.`
			},
			{
				rule: 2,
				content: stripIndents`
            	**Rule 2**・Please keep all discussion in text channels and general voice channels in English.`
			},
			{
				rule: 3,
				content: stripIndents`
				**Rule 3**・Absolutely no NSFW, offensive or disruptive content. This includes content on your Discord profile (profile picture, username, etc.).`
			},
			{
				rule: 4,
				content: stripIndents`
				**Rule 4**・Adhere to Discord's [Community Guidelines](https://discord.com/guidelines) and [Terms of Service](https://discord.com/terms).`
			},
			{
				rule: 5,
				content: stripIndents`
				**Rule 5**・Don't spam. This includes excessive amounts of messages, emojis, capital letters, pings/mentions, etc.`
			},
			{
				rule: 6,
				content: stripIndents`
				**Rule 6**・Use the appropriate channels for messaging or posting content.`
			},
			{
				rule: 7,
				content: stripIndents`
				**Rule 7**・No advertisements. We do not tolerate any kind of advertisements, whether it be for other communities or streams. You can post your content in the media channel if it is relevant and provides actual value (video/art).`
			}
		];
	}
}

module.exports = {
	RuleCommand
};
