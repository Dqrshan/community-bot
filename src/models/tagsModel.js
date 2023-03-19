const { Collection } = require('discord.js');
const { Sequelize, DataTypes } = require('sequelize');

class Tags {
	/**
	 * @param {import('@sapphire/framework').SapphireClient} client
	 */
	constructor(client) {
		this.client = client;
	}

	async init() {
		this.main = this.client.sql.define('tags_data', {
			trigger: {
				type: DataTypes.STRING,
				unique: true,
				primaryKey: true
			},
			response: {
				type: DataTypes.STRING
			}
		});

		this.data = new Collection();
		await this.main.sync();
		this.client.logger.debug('Synced Tags Model');
		const full = await this.main.findAll();
		for (const f of full) {
			this.data.set(f.trigger, f.response);
		}
	}

	async set(key, value) {
		if (!key) return;
		this.data.set(key, value);

		await this.main.upsert({
			trigger: key,
			response: value
		});
	}

	async delete(key) {
		if (!key) return;
		this.data.delete(key);

		await this.main.destroy({
			where: {
				trigger: key
			}
		});
	}

	get(key) {
		if (!key) return null;
		if (this.data.has(key)) return this.data.get(key);
		return null;
	}
}

module.exports = { Tags };
