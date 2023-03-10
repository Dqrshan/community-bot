const { Command } = require('@sapphire/framework');

class AfkCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'Sets your AFK status',
			preconditions: ['GuildOnly']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const data = await msg.client.data.afk.main.findOne({ where: { user: msg.author.id, guild: msg.guildId } }).catch(() => null);

		if (!data) {
			let reason = await args.rest('string').catch(() => 'AFK');
			reason = reason
				.replaceAll(/@everyone/g, 'everyone')
				.replaceAll(/@here/g, 'here')
				.replaceAll(/@&/g, '');
			msg.reply({ content: `You are now AFK. Reason: ${reason}` });
			await msg.client.data.afk.main.upsert({
				user: msg.author.id,
				guild: msg.guildId,
				reason,
				timestamp: Date.now()
			});
		} else {
			msg.reply('You are already AFK!');
		}
	}
}

module.exports = {
	AfkCommand
};
