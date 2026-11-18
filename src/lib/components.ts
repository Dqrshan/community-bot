import type { Message, MessageEditOptions } from "discord.js";
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    FileBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    ThumbnailBuilder
} from "discord.js";

/** Required flag for every Components V2 message. */
export const V2 = MessageFlags.IsComponentsV2;

export const COLORS = {
    info: 0x5865f2,
    success: 0x57f287,
    danger: 0xed4245,
    warning: 0xfee75c,
    gold: 0xf1c40f,
    muted: 0x2b2d31
} as const;

export type StatusKind = "info" | "success" | "error";

export const text = (content: string) =>
    new TextDisplayBuilder().setContent(content);

export const divider = () =>
    new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small);

export const gap = () =>
    new SeparatorBuilder()
        .setDivider(false)
        .setSpacing(SeparatorSpacingSize.Large);

export const thumb = (url: string, description = "Thumbnail") =>
    new ThumbnailBuilder().setURL(url).setDescription(description);

export const section = (
    lines: string[],
    accessory: ThumbnailBuilder | ButtonBuilder
) => {
    const sectionBuilder = new SectionBuilder().addTextDisplayComponents(
        ...lines.map(text)
    );
    if (accessory instanceof ThumbnailBuilder)
        return sectionBuilder.setThumbnailAccessory(accessory);
    return sectionBuilder.setButtonAccessory(accessory);
};

export const gallery = (urls: string[], description = "Attachment") =>
    new MediaGalleryBuilder().addItems(
        urls.slice(0, 10).map((url) =>
            new MediaGalleryItemBuilder()
                .setURL(url)
                .setDescription(description)
        )
    );

export const linkButton = (label: string, url: string) =>
    new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(label)
        .setURL(url);

export const actionRow = (...components: any[]) =>
    new ActionRowBuilder<any>().addComponents(...components);

export const add = (
    container: ContainerBuilder,
    ...children: any[]
): ContainerBuilder => {
    for (const child of children) {
        if (child instanceof TextDisplayBuilder)
            container.addTextDisplayComponents(child);
        else if (child instanceof SeparatorBuilder)
            container.addSeparatorComponents(child);
        else if (child instanceof SectionBuilder)
            container.addSectionComponents(child);
        else if (child instanceof MediaGalleryBuilder)
            container.addMediaGalleryComponents(child);
        else if (child instanceof FileBuilder)
            container.addFileComponents(child);
        else if (child instanceof ActionRowBuilder)
            container.addActionRowComponents(child);
    }
    return container;
};

export const card = (accent: number, ...children: any[]) =>
    add(new ContainerBuilder().setAccentColor(accent), ...children);

export const statusContainer = (kind: StatusKind, body: string) =>
    new ContainerBuilder()
        .setAccentColor(
            kind === "error"
                ? COLORS.danger
                : kind === "success"
                ? COLORS.success
                : COLORS.info
        )
        .addTextDisplayComponents(text(body));

export const attachmentRow = (name: string) =>
    new FileBuilder().setURL(`attachment://${name}`);

/**
 * Edits a message into (or within) Components V2. Legacy embeds/content must
 * be cleared explicitly, otherwise the API keeps them and rejects containers.
 */
export const editV2 = (
    message: Message,
    components: any[],
    options: Omit<MessageEditOptions, "components"> = {}
) =>
    message.edit({
        content: null,
        embeds: [],
        flags: V2,
        ...options,
        components
    });

export const isImageUrl = (url: string) => {
    const path = url.split("?")[0].toLowerCase();
    return /\.(png|jpe?g|gif|webp|avif)$/.test(path);
};

/** Renders a list of field-style lines with a bold label. */
export const field = (label: string, value: string) =>
    text(`**${label}**\n${value}`);
