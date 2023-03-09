const { Command } = require('@sapphire/framework');
const { stripIndents } = require('common-tags');
const { EmbedBuilder } = require('discord.js');
const {
	emojis: { dot }
} = require('../../config.json');

class TestCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			flags: ['embed'],
			preconditions: ['OwnerOnly']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const condition = await args.getFlags('embed');
		const desc = stripIndents`
:one: - Be respectful and civil. We have absolutely zero tolerance for any racism, sexism, hate speech, or any other offensive/disruptive behaviour. This applies to voice chats as well. The use of profanity should be kept to a minimum.

:two: - Please keep all discussion in text channels and general voice channels in English.

:three: - Absolutely no NSFW, offensive or disruptive content. This includes content on your Discord profile (profile picture, username, etc.).

:four: - Adhere to Discord's [Community Guidelines](https://discord.com/guidelines) and [Terms of Service](https://discord.com/terms).

:five: - Don't spam. This includes excessive amounts of messages, emojis, capital letters, pings/mentions, etc.

:six: - Use the appropriate channels for messaging or posting content.

:seven: - No advertisements. We do not tolerate any kind of advertisements, whether it be for other communities or streams. You can post your content in the media channel if it is relevant and provides actual value (video/art).


${dot} Listen to the server's staff. The staff will mute/kick/ban as per discretion. However, if you feel mistreated, DM an admin and the issue will be resolved.
${dot} If you have any queries, feel free to open a ticket in <#1031159883673911336> to ask a staff member.
${dot} Your presence in this server implies that you understand and accept these rules, including any further changes. These changes may be implemented at any time, and you will be duly informed.`;
		if (condition) {
			const embed = new EmbedBuilder()
				.setDescription(desc)
				.setColor('Blurple')
				.setThumbnail(msg.guild.iconURL())
				.setTitle('Rules & Guidelines')
				.setFooter({
					text: '©️ Bangalore Hub'
				});

			msg.channel.send({
				embeds: [embed]
			});
		} else {
			msg.channel.send({
				content: desc
			});
		}
	}
}

module.exports = {
	TestCommand
};
