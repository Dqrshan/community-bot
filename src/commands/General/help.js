const { Command } = require('@sapphire/framework');
const { send } = require('@sapphire/plugin-editable-commands');
const { EmbedBuilder } = require('discord.js');
const {
	emojis: { dot }
} = require('../../config.json');

class HelpCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'All supported & available commands'
		});
	}

	async messageRun(message) {
		const dirs = [...new Set(this.container.client.stores.get('commands').map((e) => e.fullCategory[0]))];
		const commands = this.container.client.stores.get('commands').map((cmd) => {
			return {
				name: cmd.name,
				dir: cmd.fullCategory[0]
			};
		});
		const dev = await this.container.client.users.fetch('838620835282812969');

		const embed = new EmbedBuilder()
			.addFields(
				dirs.map((dir) => {
					return {
						name: dot + ' ' + dir,
						value: `${commands
							.filter((c) => c.dir === dir)
							.map((c) => this.format(c.name))
							.join('\n')}`,
						inline: false
					};
				})
			)
			.setThumbnail(this.container.client.user.avatarURL())
			.setColor('Blurple')
			.setFooter({
				text: `Dev・${dev.tag}`,
				iconURL: dev.avatarURL()
			});

		return send(message, { embeds: [embed] });
	}

	/**
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	format(str) {
		return str[0].toUpperCase() + str.slice(1);
	}
}

module.exports = {
	HelpCommand
};
