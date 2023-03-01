const { DataTypes } = require('sequelize');

class AFKModel {
	/**
	 *
	 * @param {import('@sapphire/framework').SapphireClient} client
	 */
	constructor(client) {
		this.client = client;
	}

	async init() {
		this.raw = this.client.sql.define('afk_data', {
			user: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			reason: {
				type: DataTypes.STRING,
				defaultValue: 'AFK'
			},
			timestamp: {
				type: DataTypes.INTEGER,
				allowNull: true
			}
		});

		await this.raw.sync();
		this.client.logger.debug('Synced AFK Model');
	}
}

module.exports = { AFKModel };