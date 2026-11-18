import type { Client, TextChannel } from "discord.js";
import { card, COLORS, divider, text, V2 } from "./components";
import { deleteReminder, dueReminders } from "./db";

let timer: NodeJS.Timeout | null = null;
let running = false;

const deliver = async (client: Client) => {
    if (running) return;
    running = true;

    try {
        const due = await dueReminders(Date.now());
        for (const reminder of due) {
            const reminderCard = card(
                COLORS.info,
                text("## Reminder"),
                divider(),
                text(reminder.text)
            );

            let sent = false;
            const user = await client.users
                .fetch(reminder.user)
                .catch(() => null);

            if (user) {
                await user
                    .send({
                        components: [reminderCard],
                        flags: V2,
                        allowedMentions: { parse: [] }
                    })
                    .then(() => {
                        sent = true;
                    })
                    .catch(() => {});
            }

            // Fall back to the original channel if DMs are closed.
            if (!sent) {
                const channel = (await client.channels
                    .fetch(reminder.channel)
                    .catch(() => null)) as TextChannel | null;
                if (channel?.isTextBased()) {
                    const fallback = card(
                        COLORS.info,
                        text(`## Reminder\n<@${reminder.user}>`),
                        divider(),
                        text(reminder.text)
                    );
                    await channel
                        .send({
                            components: [fallback],
                            flags: V2,
                            allowedMentions: { users: [reminder.user] }
                        })
                        .catch(() => {});
                }
            }

            await deleteReminder(reminder.id).catch(() => {});
        }
    } finally {
        running = false;
    }
};

/** Polls for due reminders; safe to call more than once. */
export const startReminders = (client: Client) => {
    if (timer) return;
    timer = setInterval(() => {
        deliver(client).catch(() => {});
    }, 30_000);
    timer.unref();
    deliver(client).catch(() => {});
};
