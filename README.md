# Namma Utils - Discord Bot

![Namma Utils Banner](/home/darshan/Documents/GitHub/community-bot/assets/namma_utils_banner.jpg)

Discord community bot for the **Bangalore Hub** server — tickets, AFK tracking, snipes, role menus, audit logging and more.

Built with **TypeScript**, **discord.js v14**, **libSQL/Turso** (hosted SQLite) and deploys to **Zoho Catalyst AppSail**.

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
cp .env.example .env   # then fill in your Discord token + Turso credentials

# 3. Build & run
npm run build
npm run dev:start
```

## Environment variables

| Variable             | Required | Description                                       |
| -------------------- | -------- | ------------------------------------------------- |
| `DISCORD_TOKEN`      | ✅       | Bot token from the Discord developer portal       |
| `DISCORD_BOT_TOKEN`  | ➕       | Alternative name for the token (either works)     |
| `TURSO_DATABASE_URL` | ✅       | `libsql://…` URL of your Turso database           |
| `TURSO_AUTH_TOKEN`   | ✅       | Turso auth token                                  |
| `AI_URL`             | ❌       | Endpoint powering the `ask` command & AI channel  |
| `PORT`               | ❌       | Health/HTTP server port (default `8080`)          |

## Development

```bash
npm run watch:start
```

## License

ISC
