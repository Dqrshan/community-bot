const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

class ToggleCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'Enables/Disables a command',
			preconditions: ['OwnerOnly']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const commands = msg.client.stores.get('commands').map((c) => c.name);
		const command = await args.pick('string').catch(() => null);
		if (command !== null && !commands.includes(command)) {
			msg.reply('Invalid command');
			return;
		}
		if (!command) {
			const embed = new EmbedBuilder()
				.setTitle('Command Status')
				.setDescription(
					msg.client.stores
						.get('commands')
						.map((c) => `${c.name}・${this.status(c.name, msg.client)}`)
						.join('\n')
				)
				.setFooter({
					text: `✅ Enabled | ❌ Disabled`
				})
				.setThumbnail(msg.client.user.avatarURL())
				.setColor('Blurple');

			return msg.reply({ embeds: [embed] });
		} else {
			const cmd = msg.client.stores.get('commands').get(command);
			if (cmd.fullCategory[0] === 'Owner') return msg.reply({ content: 'Owner commands cannot be disabled' });
			if (cmd.enabled) {
				cmd.enabled = false;
				msg.reply({
					content: `Disabled \`${cmd.name}\``
				});
			} else {
				cmd.enabled = true;
				msg.reply({
					content: `Enabled \`${cmd.name}\``
				});
			}
		}
	}

	/**
	 *
	 * @param {String} c
	 * @param {import('@sapphire/framework').SapphireClient} client
	 */
	status(c, client) {
		return client.stores.get('commands').get(c).enabled ? '✅' : '❌';
	}
}

module.exports = {
	ToggleCommand
};
