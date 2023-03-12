const { AllFlowsPrecondition } = require('@sapphire/framework');
const { owners } = require('../config.json');

class UserPrecondition extends AllFlowsPrecondition {
	#message = 'This command can only be used by the staff.';

	/**
	 * @param {import('discord.js').CommandInteraction} interaction
	 */
	chatInputRun(interaction) {
		return this.doStaffCheck(interaction.member);
	}

	/**
	 * @param {import('discord.js').ContextMenuCommandInteraction} interaction
	 */
	contextMenuRun(interaction) {
		return this.doStaffCheck(interaction.member);
	}

	/**
	 * @param {import('discord.js').Message} message
	 */
	messageRun(message) {
		return this.doStaffCheck(message.member);
	}

	/**
	 * @param {import('discord.js').GuildMember} member
	 */
	doStaffCheck(member) {
		return member.roles.cache.some((r) => r.name.toLowerCase().includes('staff'))
			? this.ok()
			: this.error({ message: this.#message }) || owners.includes(member.user.id)
			? this.ok()
			: this.error({ message: this.#message });
	}
}

module.exports = {
	UserPrecondition
};
