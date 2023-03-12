const { Command } = require('@sapphire/framework');
const { stripIndents } = require('common-tags');
const { EmbedBuilder } = require('discord.js');
const {
	emojis: { dot }
} = require('../../config.json');

class TestCommand extends Command {
	constructor(context, options) {
		super(context, {
			...options,
			preconditions: ['OwnerOnly']
		});
	}
	/**
	 *
	 * @param {import('discord.js').Message} msg
	 * @param {import('@sapphire/framework').Args} args
	 */
	async messageRun(msg, args) {
		const m = await args.pick('message').catch(async () => (msg.reference.messageId ? await msg.fetchReference() : null));

		const usages = stripIndents`
        • **Warning members**: \`-warn @user [reason]\`
        > Eg: -warn @Lorenz#8262 being toxic
        
        • **Muting members**: \`-m @user <time> [reason]\`
        > Eg: -m @Lorenz#8262 1h gif spam
        
        • **Deleting messages**: \`-purge <limit> [flag]\`
        > Eg: -purge 10 ; -purge 10 bots ; -purge 10 @Lorenz#8262
        
        • **Enable slowmode**: \`-slowmode <time>\`
        > Eg: -slowmode 10s 
        
        • **Kicking members from voice channels**: \`-voice-kick @user\`
        > Eg: -voice-kick @Lorenz#8262
        `;

		const rules = stripIndents`
        **The following guidelines are meant to be a continuation of the general rules, directed towards the staff.**

• Staff should be courteous, helpful, and civil. Insulting, berating, or abusing members is prohibited.
• Listen to the Admins, their say is final in most situations. If you feel like they've made a lapse in judgment or a wrong decision, please DM @Lorenz.
• Don't pick fights or argue with members to provoke them into breaking rules.
• It is prohibited to leak information such as private conversations from the staff text channels unless given explicit permission by an Admin.
• Don't take yourself too seriously. You're a staff member on an obscure Discord server. If you're pretentious, snarky, or narcissistic about your rank, you'll get demoted.
• If you are challenging the authority of fellow staff members, not being cooperative, or persistently bringing up old drama for the sake of "stirring the pot", you may be demoted.
• Changing the nickname of a member against their will, muting, kicking, or banning without a properly logged (and legitimate) reason, will not be tolerated.

**❓ What do I do if I see an Admin break a rule?**
> Please DM @Lorenz, and provide the following:
> \`\`\`• Time and Date:
> • Which Rule(s) they have broken:
> • Evidence (i.e screenshots, recordings):
> • Backstory/context:\`\`\`
        `;

		const ticket = stripIndents`
        **The following rules are to be followed in ticket channels**

• Do not crowd in tickets (not more than 1 staff member). Ping another staff member, or leave a message, in case you want them to take over.
• Save transcripts of serious problems / helpful questions for future references.
• Please be respectful and formal.
• Do not send short messages while starting a ticket conversation ("hi", "yo", "what").
• Use \`+ticket\` for a proper embed reply with questions`;

		const perms = stripIndents`
        ${dot} <@&1083701573626110042> : \`*\`
        ${dot} <@&1077606283236081826> : \`*\`
        ${dot} <@&1023702510772420668> : \`*\`
        ${dot} <@&1034775676034756618> : kick, purge, voice-kick, slowmode, view-case, remove-case, reason, \`!!\`
        ${dot} <@&1077606255218130984> : purge, slowmode, voice-kick, reason, remove-case, view-case, \`!!\`
        ${dot} <@&1023702510747258927> : purge, slowmode, \`!!\`
        ${dot} <@&1033692184005840956> : \`!!\`
        
        \`*\`: Administrator [access to all commands]

        \`!!\`: warn, mute, unmute`;

		const base = new EmbedBuilder()
			.setThumbnail(msg.guild.iconURL())
			.setColor('Blurple')
			.setImage('https://singlecolorimage.com/get/5865f2/400x20');
		const embeds = [
			EmbedBuilder.from(base.toJSON()).setTitle('Rules').setDescription(rules),
			EmbedBuilder.from(base.toJSON()).setTitle('Ticket Rules').setDescription(ticket),
			EmbedBuilder.from(base.toJSON()).setTitle('Command Usage').setDescription(usages).setFooter({
				text: 'For more details on a specific command, use `-help <cmdName>`. Eg: `-help warn`',
				iconURL: 'https://www.iconsdb.com/icons/preview/color/5865F2/info-3-xxl.png'
			}),
			EmbedBuilder.from(base.toJSON()).setTitle('Permissions').setDescription(perms)
		];

		if (!m || m.author.id !== msg.client.user.id) {
			msg.delete();
			await msg.channel.send({ embeds });
		} else {
			msg.delete();
			await m.edit({
				embeds
			});
		}
	}
}

module.exports = {
	TestCommand
};
