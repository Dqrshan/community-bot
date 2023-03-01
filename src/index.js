require('./lib/setup');
require('dotenv').config();
const { LogLevel, SapphireClient } = require('@sapphire/framework');
const { prefix } = require('./config.json');
const { GatewayIntentBits, Partials } = require('discord.js');
const Dokdo = require('dokdo');

const client = new SapphireClient({
	defaultPrefix: prefix,
	regexPrefix: /^(hey +)?bot[,! ]/i,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	shards: 'auto',
	intents: [
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Channel],
	loadMessageCommandListeners: true
});

client.dokdo = new Dokdo(client, { prefix, secrets: [client.token], aliases: ['dok', 'dokdo'] });

const main = async () => {
	try {
		client.logger.info('Logging in');
		await client.login(process.env.TOKEN);
		client.logger.info('Logged in');
	} catch (error) {
		client.logger.fatal(error);
		client.destroy();
		process.exit(1);
	}
};

main();
