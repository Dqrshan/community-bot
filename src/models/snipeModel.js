const { DataTypes } = require('sequelize');
const { Collection } = require('discord.js');

class Snipes {
	/**
	 *
	 * @param {import('@sapphire/framework').SapphireClient} client
	 */
	constructor(client) {
		this.client = client;
	}

	async init() {
		this.main = this.client.sql.define('snipe_data', {
			channel: {
				type: DataTypes.STRING,
				allowNull: false
			},
			data: {
				type: DataTypes.STRING,
				allowNull: false
			},
			timestamp: {
				type: DataTypes.INTEGER,
				allowNull: false
			}
		});

		this.data = new Collection();
		await this.main.sync();
		this.client.logger.debug('Synced Snipe Model');
		const full = (await this.main.findAll()) || [];
		for (const f of full) {
			let data = this.data.get(f.channel) || [];

			const raw = JSON.parse(f.data);
			data.unshift({
				message: raw.message,
				content: raw.content,
				author: raw.author,
				attachments: raw.attachments,
				embeds: raw.embeds,
				timestamp: raw.timestamp
			});

			this.data.set(f.channel, data);
		}
	}

	async set(channel, data) {
		if (!channel) return null;

		let raw = this.data.get(channel) || [];
		raw.unshift({
			message: data.message,
			author: data.author,
			content: data.content,
			attachments: data.attachments,
			embeds: data.embeds,
			timestamp: data.timestamp
		});
		this.data.set(channel, raw);

		await this.main.upsert({
			channel,
			timestamp: data.timestamp,
			data: JSON.stringify(data)
		});

		return data;
	}

	get(channel) {
		if (!channel) return null;

		return this.data.get(channel) ?? null;
	}
}

module.exports = { Snipes };
