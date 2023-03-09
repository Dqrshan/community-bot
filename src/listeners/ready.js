const { Listener } = require('@sapphire/framework');
const { blue, gray, green, magenta, magentaBright, white, yellow } = require('colorette');
const { ActivityType } = require('discord.js');

const dev = process.env.NODE_ENV !== 'production';

class UserEvent extends Listener {
	style = dev ? yellow : blue;

	constructor(context, options = {}) {
		super(context, {
			...options,
			once: true
		});
	}

	async run() {
		this.printBanner();
		this.printStoreDebugInformation();
		const activities = [
			{
				name: 'You',
				type: ActivityType.Watching
			},
			{
				name: `${this.container.client.options.defaultPrefix}help`,
				type: ActivityType.Listening
			}
		];
		setInterval(() => {
			const curr = activities.shift();
			this.container.client.user.setPresence({
				activities: [
					{
						name: curr.name,
						type: curr.type
					}
				],
				status: 'dnd'
			});
			activities.push(curr);
		}, 10 * 1000);

		await this.container.client.data.afk.init();
		await this.container.client.data.mention.init();
	}

	printBanner() {
		const success = green('+');

		const llc = dev ? magentaBright : white;
		const blc = dev ? magenta : blue;

		const line01 = llc('');
		const line02 = llc('');
		const line03 = llc('');

		// Offset Pad
		const pad = ' '.repeat(7);

		console.log(
			String.raw`
${line01} ${pad}${blc('1.0.0')}
${line02} ${pad}[${success}] Gateway
${line03}${dev ? ` ${pad}${blc('<')}${llc('/')}${blc('>')} ${llc('DEVELOPMENT MODE')}` : ''}
		`.trim()
		);
	}

	printStoreDebugInformation() {
		const { client, logger } = this.container;
		const stores = [...client.stores.values()];
		const last = stores.pop();

		for (const store of stores) logger.info(this.styleStore(store, false));
		logger.info(this.styleStore(last, true));
	}

	styleStore(store, last) {
		return gray(`${last ? '└─' : '├─'} Loaded ${this.style(store.size.toString().padEnd(3, ' '))} ${store.name}.`);
	}
}

module.exports = {
	UserEvent
};
