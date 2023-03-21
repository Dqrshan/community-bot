const { Listener } = require('@sapphire/framework');

class StatsListener extends Listener {
	constructor(context, options = {}) {
		super(context, {
			...options,
			event: 'ready'
		});
	}

	async run() {
		setInterval(async () => {
			const guild = this.container.client.guilds.cache.get('1023702510730494012');
			if (!guild) return;
			const channel = guild.channels.cache.get('1083327348788695090');
			if (!channel) return;

			if (parseInt(channel.name.replace('Members・', '')) === guild.memberCount) return;

			await channel.edit(
				{
					name: `Members・${guild.memberCount}`
				},
				'Statistics Refresh'
			);
			this.container.client.logger.info('Updated Stats');
		}, 60 * 1000);
	}
}

module.exports = {
	StatsListener
};
