import {
	APIButtonComponentWithCustomId,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	Message,
} from 'discord.js';

export const Pagination = async (
	message: Message,
	content: string,
	pages: EmbedBuilder[],
	buttonList: ButtonBuilder[],
	timeout: number = 60000
) => {
	if (!pages) throw new Error('Pages are not given.');
	if (!buttonList) throw new Error('Buttons are not given.');
	if (
		buttonList[0].data.style === ButtonStyle.Link ||
		buttonList[1].data.style === ButtonStyle.Link
	)
		throw new Error('Link buttons are not supported');
	if (buttonList.length !== 2) throw new Error('Need two buttons.');

	let page = 0;

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonList);

	const curPage = await message.reply({
		content,
		embeds: [
			pages[page].setFooter({
				text: `Page ${page + 1} / ${pages.length}`,
			}),
		],
		components: [row],
	});

	// @ts-ignore
	const filter = async (i: any) => {
		if (
			(i.customId ===
				(buttonList[0].data as APIButtonComponentWithCustomId)
					.custom_id ||
				i.customId ===
					(buttonList[1].data as APIButtonComponentWithCustomId)
						.custom_id) &&
			i.user.id === message.author.id
		)
			return true;
		else
			i.reply({
				ephemeral: true,
				content: 'This pagination is not for you!',
			}).catch(() => {});
		return false;
	};

	const collector = await curPage.createMessageComponentCollector({
		filter,
		time: timeout,
	});

	collector.on('collect', async (i) => {
		switch (i.customId) {
			case (buttonList[0].data as APIButtonComponentWithCustomId)
				.custom_id:
				page = page > 0 ? --page : pages.length - 1;
				break;
			case (buttonList[1].data as APIButtonComponentWithCustomId)
				.custom_id:
				page = page + 1 < pages.length ? ++page : 0;
				break;
			default:
				break;
		}
		await i.deferUpdate();
		await curPage.edit({
			embeds: [
				pages[page].setFooter({
					text: `Page ${page + 1} / ${pages.length}`,
				}),
			],
			components: [row],
		});
		collector.resetTimer();
	});

	collector.on('end', (_, reason) => {
		if (reason !== 'messageDelete') {
			const disabledRow =
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					buttonList[0].setDisabled(true),
					buttonList[1].setDisabled(true)
				);
			curPage.edit({
				embeds: [
					pages[page].setFooter({
						text: `Page ${page + 1} / ${pages.length}`,
					}),
				],
				components: [disabledRow],
			});
		}
	});

	return curPage;
};
