# Celestia Light Node Monitor Bot

A monitoring bot that tracks your Celestia Light Node's status and sends notifications via Telegram. It alerts you when your node falls behind, stops, or experiences synchronization issues.

## Features

- Real-time monitoring of node block height
- Multiple remote RPC comparisons for reliability
- Telegram notifications for:
  - Block height differences
  - Node synchronization status
  - Node operational status
- Multi-language support
- Customizable alert messages
- Configurable alert thresholds

## Prerequisites

- Node.js (v16 or higher)
- Running Celestia Light Node
- Telegram Bot Token

## Quick Start

1. Clone the repository:

git clone https://github.com/yourusername/celestia-light-monitor
cd celestia-light-monitor

2. Install dependencies:

npm install

3. Create a `.env` file in the root directory you can use .env.EXAMPLE file as a template:

4. Run the bot:

pm2 start src/scheduler.js --name my-alert-bot


## Telegram Bot Setup

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create new bot with `/newbot` command
3. Copy the provided token to `TELEGRAM_TOKEN` in `.env`
4. Add bot to your group
5. Get your chat ID:
   - You can use @username_to_id_bot to get your chat id
   - Copy the `chat_id` to `TELEGRAM_CHAT_ID` in `.env`

## Alert Types
- 🔴 **Warning**: Node is 5+ blocks behind
- 🔴🔴 **Critical**: Node is 50+ blocks behind
- ⚠️ **Not Responding**: Local node connection issues
- ✅ **Recovered**: Node caught up with network
- ⛔️ **Stopped**: Node not running
- 🔄 **Syncing**: Node catching up

## Configuration


### Language Settings and Customize Alert Messages

Edit the `config.json` file to customize your alert messages and thresholds. To change the language of the alerts you can add new languages and use them by changing defaultLanguage. (Default English)


### Alert Thresholds

- `BLOCK_HEIGHT_DIFFERENCE_THRESHOLD`: Minimum block height difference for a warning
- `BLOCK_HEIGHT_DIFFERENCE_CONSECUTIVE_THRESHOLD`: Minimum consecutive block height difference for a critical alert


