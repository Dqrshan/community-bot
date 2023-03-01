const { Command } = require('@sapphire/framework');

class UserCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			aliases: ['dok'],
			description: 'Dokdo debugging tool',
			preconditions: ['OwnerOnly']
		});
	}

	async messageRun() {
		return;
	}
}

module.exports = {
	UserCommand
};
