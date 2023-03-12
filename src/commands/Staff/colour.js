const { Command } = require('@sapphire/framework');
const { Message, EmbedBuilder, resolveColor } = require('discord.js');

class ColourCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'Adds a custom role with given colour',
			preconditions: ['StaffOnly', 'GuildOnly']
		});
	}
	/**
	 *
	 * @param {Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const role = msg.guild.roles.cache.get('1084108737679212594');
		if (!role) {
			msg.reply({
				content: 'Missing the colour role :('
			});
			return;
		}

		const hex = await args.pick('string').catch(() => null);
		if (!hex) {
			msg.reply({
				content: 'Input a valid HEX code!'
			});
			return;
		}

		await msg.guild.roles.edit(role.id, {
			color: resolveColor(hex)
		});

		await msg.member.roles.add(role, `Colour Test: '#${resolveColor(hex).toString(16).padStart(6, '0')}'`);
		msg.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(resolveColor(hex))
					.setTitle(hex)
					.setDescription(`⚠️ This role will be removed <t:${Math.round((Date.now() + 30000) / 1000)}:R>`)
					.setThumbnail(`https://singlecolorimage.com/get/${resolveColor(hex).toString(16).padStart(6, '0')}/200x200`)
			]
		});

		setTimeout(() => {
			msg.member.roles.remove(role.id);
		}, 30 * 1000);
	}
}

module.exports = {
	ColourCommand
};
