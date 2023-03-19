const { DataTypes } = require('sequelize');

class AFK {
	/**
	 *
	 * @param {import('@sapphire/framework').SapphireClient} client
	 */
	constructor(client) {
		this.client = client;
	}

	async init() {
		this.main = this.client.sql.define('afk_data', {
			user: {
				type: DataTypes.STRING,
				allowNull: false
			},
			guild: {
				type: DataTypes.STRING,
				allowNull: false
			},
			reason: {
				type: DataTypes.STRING,
				defaultValue: 'AFK'
			},
			timestamp: {
				type: DataTypes.INTEGER,
				allowNull: false
			}
		});

		await this.main.sync();
		this.client.logger.debug('Synced AFK Model');
	}
}

module.exports = { AFK };
