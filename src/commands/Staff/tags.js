const { Command } = require('@sapphire/framework');
const { tagPrefix } = require('../../config.json');

const subs = ['list', 'add', 'delete'];

class TagCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			aliases: ['tag'],
			description: 'Add/Create/Show Tags',
			preconditions: ['StaffOnly']
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const sub = (await args.pick('string').catch(() => 'list')).toLowerCase();

		switch (sub) {
			case 'list':
				return this.listTags(msg);
			case 'delete':
				return await this.deleteTag(msg, args);
			case 'add':
				return await this.addTag(msg, args);
			default:
				return msg.reply('Invalid SubCommand');
		}
	}

	/**
	 * @param {import('discord.js').Message} msg
	 */
	listTags(msg) {
		return msg.reply({
			content: `[Tag Prefix: \`${tagPrefix}\`] Tags: ${Array.from(msg.client.data.tags.data.keys())
				.map((k) => `\`${k}\``)
				.join(', ')}`
		});
	}
	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async addTag(msg, args) {
		const trigger = (await args.pick('string').catch(() => null)).toLowerCase();
		const response = await args.rest('string').catch(() => null);
		if (!trigger || !response) return msg.reply(`Invalid Syntax: \`tags add <trigger> <response>\``);
		if (msg.client.data.tags.data.has(trigger)) return msg.reply('Tag already exists!');

		await msg.client.data.tags.set(trigger, response);
		return msg.reply({
			content: `Created tag \`${trigger}\`.`
		});
	}

	/**
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async deleteTag(msg, args) {
		const trigger = (await args.pick('string').catch(() => null)).toLowerCase();
		if (!trigger) return msg.reply(`Invalid Syntax: \`tags delete <trigger>\``);
		if (!msg.client.data.tags.data.has(trigger)) return msg.reply('Tag does not exist!');

		await msg.client.data.tags.delete(trigger);
		return msg.reply({
			content: `Deleted tag \`${trigger}\``
		});
	}
}

module.exports = { TagCommand };
