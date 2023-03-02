const { DataTypes } = require('sequelize');

class MentionModel {
	/**
	 *
	 * @param {import('@sapphire/framework').SapphireClient} client
	 */
	constructor(client) {
		this.client = client;
	}

	async init() {
		this.raw = this.client.sql.define('mention_data', {
			user: {
				type: DataTypes.STRING,
				allowNull: false
			},
			guild: {
				type: DataTypes.STRING,
				allowNull: false
			},
			member: {
				type: DataTypes.STRING,
				allowNull: false
			},
			msg: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			}
		});

		await this.raw.sync();
		this.client.logger.debug('Synced Mention Model');
	}
}

module.exports = { MentionModel };
