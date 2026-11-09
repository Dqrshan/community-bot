# Namma Utils - Discord Bot

![Namma Utils Banner](/home/darshan/Documents/GitHub/community-bot/assets/namma_utils_banner.jpg)

Discord community bot for the **Bangalore Hub** server — tickets, AFK tracking, snipes, role menus, audit logging and more.

Built with **TypeScript**, **discord.js v14** and **Prisma** (SQLite).

## Join us!

[![Bangalore Hub](https://discordapp.com/api/guilds/1023702510730494012/widget.png?style=banner3)](https://dsc.gg/bangalore)

## Features

- 🎫 Ticket system with transcripts & auto-close
- 💤 AFK status with mention tracking
- 💀 Snipe deleted messages
- 🧩 Self-assignable role menus (grade / activity / ping / school roles)
- 📜 Rule lookups, member stats, Urban Dictionary, AI chat
- 🛡️ Audit logging & scheduled database backups

## Requirements

- Node.js 22+
- A Discord bot token ([developer portal](https://discord.com/developers/applications))

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # then fill in DISCORD_TOKEN

# 3. Set up the database
npm run db:start

# 4. Build & run
npm run build
npm run dev:start
```

## Development

```bash
npm run watch:start
```

## License

ISC
