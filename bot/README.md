# R2K2 Tournament Kick Chat Bot

This is the chat bot that handles tournament registrations from your Kick stream chat.

## Commands

| Command | Description |
|---------|-------------|
| `!enter <acebet_username>` | Register for the current tournament |
| `!slot <slot_name> <super/regular>` | Submit your slot call for your current match |
| `!status` | Get current tournament status |
| `!bracket` | View remaining players |
| `!help` | Show available commands |

### Examples

```
!enter Haz369
!slot Gates of Olympus super
!slot Sweet Bonanza regular
!status
!bracket
```

## Bot Responses

| Response | Meaning |
|----------|---------|
| `Entry ACCEPTED!` | User is registered for the tournament |
| `Entry DENIED - Not under code R2K2` | User not found in your Acebet affiliate list |
| `Entry DENIED - Not enough wager` | User hasn't met the minimum wager requirement |
| `Entry DENIED - Not active` | User is not currently active under R2K2 code |
| `Slot call recorded: [slot] (type)` | Slot selection submitted for your match |
| `You don't have an active match` | No current match to submit slot for |

## Setup

### 1. Install Dependencies

```bash
cd bot
npm install ws
```

### 2. Environment Variables

Create a `.env` file in the bot directory:

```env
KICK_CHANNEL_ID=your_kick_channel_id
API_BASE_URL=https://www.r2k2.gg
BOT_SECRET=optional_secret_for_api_auth
```

To find your Kick channel ID:
1. Go to your Kick channel page
2. Open browser developer tools (F12)
3. Go to Network tab
4. Look for API calls that include your channel ID

### 3. Run the Bot

```bash
npx ts-node kick-bot.ts
```

Or compile and run:

```bash
npx tsc kick-bot.ts
node kick-bot.js
```

## Deployment Options

### Option 1: Run Locally
Run the bot on your local machine while streaming.

### Option 2: VPS/Server
Deploy to a VPS (DigitalOcean, Linode, etc.) for 24/7 operation.

### Option 3: Railway/Render
Deploy as a background worker on a cloud platform.

## Architecture

```
Kick Chat -> Bot (WebSocket) -> Tournament API -> Supabase
                                    |
                                    v
                            Tournament Website
```

## Sending Messages

The current implementation only listens to chat. To send messages back to Kick chat, you'll need:

1. **Kick API Access**: Contact Kick for API credentials to send messages
2. **Alternative**: Use a browser automation tool to send messages through the Kick web interface

## Troubleshooting

### Bot Not Connecting
- Check your KICK_CHANNEL_ID is correct
- Verify your network allows WebSocket connections

### Commands Not Working
- Ensure API_BASE_URL points to your deployed tournament site
- Check the API routes are accessible

### Registration Failing
- Verify ACEBET_API_TOKEN is set on your tournament site
- Check the Acebet username is valid
