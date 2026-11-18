import {
	APIButtonComponentWithCustomId,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	Message,
	MessageFlags
} from "discord.js";
import { V2, statusContainer } from "./components";

export const Pagination = async (
	message: Message,
	pages: ContainerBuilder[],
	buttonList: ButtonBuilder[],
	timeout: number = 60000
) => {
	if (!pages?.length) throw new Error("Pages are not given.");
	if (!buttonList) throw new Error("Buttons are not given.");
	if (
		buttonList[0].data.style === ButtonStyle.Link ||
		buttonList[1].data.style === ButtonStyle.Link
	)
		throw new Error("Link buttons are not supported");
	if (buttonList.length !== 2) throw new Error("Need two buttons.");

	let page = 0;

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonList);
	pages.forEach((container) => container.addActionRowComponents(row));

	const curPage = await message.reply({
		components: [pages[page]],
		flags: V2
	});

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
			await i
				.reply({
					components: [
						statusContainer(
							"error",
							"This pagination is not for you!"
						)
					],
					flags: V2 | MessageFlags.Ephemeral
				})
				.catch(() => {});
		return false;
	};

	const collector = await curPage.createMessageComponentCollector({
		filter,
		time: timeout
	});

	collector.on("collect", async (i) => {
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
		await curPage.edit({ components: [pages[page]] });
		collector.resetTimer();
	});

	collector.on("end", (_, reason) => {
		if (reason !== "messageDelete") {
			buttonList[0].setDisabled(true);
			buttonList[1].setDisabled(true);
			curPage
				.edit({ components: [pages[page]] })
				.catch(() => {});
		}
	});

	return curPage;
};
