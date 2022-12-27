const { Listener } = require('@sapphire/framework');

class MemberStats extends Listener {
	constructor(context, options) {
		super(context, {
			...options,
			event: 'ready'
		});
	}
	async run() {
		setInterval(async () => {
			const guild = this.container.client.guilds.cache.get('1023702510730494012');
			const channel = guild.channels.cache.get('1057275734315511908');
			if (!channel) return;
			await channel.edit(
				{
					name: `Members・${guild.memberCount}`
				},
				'Statistics Refresh'
			);
			this.container.client.logger.info(`Stats Updated!`);
		}, 30 * 1000);
	}
}

module.exports = { MemberStats };
