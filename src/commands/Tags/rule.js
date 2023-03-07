const { Command } = require('@sapphire/framework');
const { send } = require('@sapphire/plugin-editable-commands');
const { stripIndents } = require('common-tags');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class RuleCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'Rule tags',
			aliases: ['rules'],
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
				.setEmoji('📘')
				.setURL('https://discord.com/channels/1023702510730494012/1075735310736035900/1075737635408072794')
		);

		const n = await args.pick('integer').catch(() => null);
		const keyword = await args.pick('string').catch(() => null);

		if (!n && !keyword) return msg.reply({ components: [button] });

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

		return msg.reply({
			components: [button],
			content
		});
	}

	rules() {
		return [
			{
				rule: 1,
				content: stripIndents`
            **1. Be respectful**
            You must respect all users, regardless of your liking towards them. Treat others the way you want to be treated.`
			},
			{
				rule: 2,
				content: stripIndents`
            **2. No Inappropriate Language**
            The use of profanity should be kept to a minimum. However, any derogatory language towards any user is prohibited.
            `
			},
			{
				rule: 3,
				content: stripIndents`
            **3. No spamming**
            Don't send a lot of small messages right after each other. Do not disrupt chat by spamming.`
			},
			{
				rule: 4,
				content: stripIndents`
            **4. No pornographic/adult/other NSFW material**
            This is a community server and not meant to share this kind of material.`
			},
			{
				rule: 5,
				content: stripIndents`
            **5. No advertisements**
            We do not tolerate any kind of advertisements, whether it be for other communities or streams. You can post your content in the media channel if it is relevant and provides actual value (Video/Art)`
			},
			{
				rule: 6,
				content: stripIndents`
            **6. No offensive names and profile pictures**
            You will be asked to change your name or picture if the staff deems them inappropriate.`
			},
			{
				rule: 7,
				content: stripIndents`
            **7. Server Raiding**
            Raiding or mentions of raiding are not allowed.`
			},
			{
				rule: 8,
				content: stripIndents`
            **8. Direct & Indirect Threats**
            Threats to other users of DDoS, Death, DoX, abuse, and other malicious threats are absolutely prohibited and disallowed.`
			},
			{
				rule: 9,
				content: stripIndents`
                **9. Follow the Discord's Terms of Service & Community Guidelines**
                Terms of Service: <https://discord.com/terms>
                Community Guidelines: <https://discord.com/guidelines>`
			}
		];
	}
}

module.exports = {
	RuleCommand
};
