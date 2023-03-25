const { Listener } = require('@sapphire/framework');
const { blue, gray, green, magenta, magentaBright, white, yellow } = require('colorette');
const { ActivityType, AttachmentBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { CronJob } = require('cron');

const dev = process.env.NODE_ENV !== 'production';

const cId = '1083327348788695090';
const gId = '1023702510730494012';

class UserEvent extends Listener {
	style = dev ? yellow : blue;

	constructor(context, options = {}) {
		super(context, {
			...options,
			once: true
		});
	}

	async run() {
		// @sapphire defaults
		this.printBanner();
		this.printStoreDebugInformation();

		// dynamic status
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

		// initiate databases
		await this.container.client.data.afk.init();
		await this.container.client.data.mention.init();
		await this.container.client.data.snipes.init();
		await this.container.client.data.tags.init();

		// guild stats update + voice join
		const vCh = this.container.client.channels.cache.get(cId);

		const conn = joinVoiceChannel({
			channelId: cId,
			guildId: gId,
			adapterCreator: vCh.guild.voiceAdapterCreator
		});

		conn.on(VoiceConnectionStatus.Ready, () => {
			this.container.client.logger.info('Joined voice channel');
		});

		setInterval(async () => {
			const guild = this.container.client.guilds.cache.get(gId);
			if (parseInt(vCh.name.replace('Members・', '')) === guild.memberCount) return;
			await vCh.edit({ name: `Members・${guild.memberCount}` }).catch(() => {});
			this.container.client.logger.info('Updated Member Count');
		}, 60 * 1000);

		// ready!
		this.container.client.logger.debug(`Logged in as ${this.container.client.user.tag} (${this.container.client.id})`);

		// cron job for database backup
		const job = new CronJob(
			'0 */12 * * *',
			async () => {
				const channel = this.container.client.channels.cache.get('1089230317430247495');
				const file = new AttachmentBuilder('data/database.sqlite', { name: 'database.sqlite' });
				await channel.send({ content: `Backup: \`${new Date().toString()}\``, files: [file] }).catch(() => {});
				this.container.client.logger.debug(`Sent Database Backup [${new Date().toString()}]`);
			},
			null,
			false,
			'Asia/Kolkata'
		);

		try {
			job.start();
			this.container.client.logger.debug('Cron Job has started!');
		} catch (error) {
			this.container.client.logger.error(error);
		}
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
