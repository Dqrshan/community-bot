const { Command } = require('@sapphire/framework');
const { send, reply } = require('@sapphire/plugin-editable-commands');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const {
	emojis: { dot },
	owners,
	links: { rules, terms, topgg, website },
	prefix,
	tagPrefix
} = require('../../config.json');

const links = `[Rules](${rules})・[ToS](${terms})・[Top.gg](${topgg})・[Web](${website})`;

class HelpCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			description: 'All supported & available commands',
			aliases: ['h']
		});
	}

	/**
	 * @param {import('discord.js').Message} message
	 */
	async messageRun(message) {
		let dirs;
		if (owners.includes(message.author.id)) {
			dirs = [...new Set(this.container.client.stores.get('commands').map((e) => e.fullCategory[0]))].sort((a, b) => a - b);
		} else {
			dirs = [
				...new Set(
					this.container.client.stores
						.get('commands')
						.filter((e) => e.fullCategory[0] !== 'Owner')
						.map((e) => e.fullCategory[0])
				)
			].sort((a, b) => a - b);
		}
		const cats = dirs.map((dir) => {
			const commands = this.container.client.stores
				.get('commands')
				.filter((c) => c.fullCategory[0] === dir)
				.sort((x, y) => y.name - x.name);
			return {
				dir,
				commands
			};
		});
		const menu = (x) =>
			new StringSelectMenuBuilder()
				.setPlaceholder('Select..')
				.setCustomId('_H')
				.setOptions(
					dirs.map((dir) => {
						return {
							emoji: '1080379549688275024',
							label: dir,
							value: dir.toLowerCase()
						};
					})
				)
				.setDisabled(x);

		const init = await reply(message, {
			content: `Select a category from the menu below!`,
			components: [new ActionRowBuilder().setComponents(menu(false))]
		}).catch(() => {});

		const collector = init.createMessageComponentCollector({
			componentType: ComponentType.StringSelect,
			filter: async (i) => {
				if (i.user.id === message.author.id) return true;
				else i.reply({ ephemeral: true, content: 'This menu is not for you!' }).catch(() => {});
				return false;
			},
			time: 60 * 1000
		});

		collector.on('collect', async (i) => {
			await i.deferUpdate().catch(() => {});
			const [value] = i.values;
			const dir = cats.find((d) => d.dir.toLowerCase() === value);

			const embed = new EmbedBuilder()
				.setTitle(`${this.format(dir.dir)} (${dir.commands.size})`)
				.setAuthor({
					name: i.client.user.username,
					iconURL: i.client.user.avatarURL()
				})
				.setDescription(links)
				.addFields(
					dir.commands.map((c) => {
						return {
							name: `${dot} ${c.name}`,
							value: `${c.description ? c.description : 'No description'}${
								c.aliases && c.aliases.length ? `\n__Aliases:__\n${c.aliases.map((a) => `\`${a}\``).join(', ')}` : ''
							}`,
							inline: c.aliases ? false : true
						};
					})
				)
				.setColor('Blurple')
				.setFooter({
					text: `Prefix: ${prefix} | Tag Prefix: ${tagPrefix} | Requested by ${i.user.tag}`,
					iconURL: i.member.displayAvatarURL()
				})
				.setImage('https://singlecolorimage.com/get/5865F2/368x20');

			await init.edit({ embeds: [embed] }).catch(() => {});
			collector.resetTimer();
		});

		collector.once('end', async () => {
			await init.edit({ components: [new ActionRowBuilder().setComponents(menu(true))] }).catch(() => {});
		});
	}

	/**
	 *
	 * @param {string} str
	 * @returns {string}
	 */
	format(str) {
		const emojis = {
			General: '🤖',
			Owner: '👑',
			Staff: '🛠️',
			Tags: '🎟️',
			Utils: '⚙️'
		};

		return `\\${emojis[str]} ${str}`;
	}
}

module.exports = {
	HelpCommand
};
