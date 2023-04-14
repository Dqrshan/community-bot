const { Listener } = require('@sapphire/framework');
const { ActivityType, AttachmentBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');
const { CronJob } = require('cron');
const { owners } = require('../config.json');

const cId = '1083327348788695090';
const gId = '1023702510730494012';

class UserEvent extends Listener {
	constructor(context, options = {}) {
		super(context, {
			...options,
			once: true
		});
	}

	async run() {
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
				await channel
					.send({ content: `${owners.map((o) => `<@!${o}>`).join(', ')} | Database Backup | \`${new Date().toString()}\``, files: [file] })
					.catch(() => {});
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
}

module.exports = {
	UserEvent
};
