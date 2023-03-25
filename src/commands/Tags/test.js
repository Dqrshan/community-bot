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
			preconditions: ['OwnerOnly']
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const e1 = new EmbedBuilder().setColor('Blurple').setTitle();
	}
}

module.exports = {
	TestCommand
};
