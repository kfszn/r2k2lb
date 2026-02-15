# R2K2 Kick Tournament Bot

This bot listens to your Kick channel and processes tournament commands like `!slot`, `!enter`, `!status`, etc., automatically adding entries to your admin panel.

## Setup

### 1. Get Your Kick Channel ID
- Go to your Kick channel
- Open browser dev tools (F12)
- Go to Network tab
- Refresh the page
- Look for a request with `chatroomId` in the response
- That's your `KICK_CHANNEL_ID`

### 2. Set Environment Variables
Copy `.env.example` to `.env` and fill in:
```
KICK_CHANNEL_ID=your_channel_id
API_BASE_URL=https://www.r2k2.gg
BOT_SECRET=your_secret_from_vercel
```

### 3. Deploy to Railway

**Option A: Via GitHub (Recommended)**
1. Push this bot folder to your GitHub repo
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repo
5. Add environment variables in Railway dashboard
6. Done! Bot will auto-start

**Option B: Via Railway CLI**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 4. Local Testing
```bash
npm install
npm run dev
```

## Commands
- `!slot <slot_name>` - Add slot call (when Slot Calls is OPEN)
- `!enter <username>` - Register for tournament
- `!status` - Tournament status
- `!bracket` - View remaining players
- `!help` - Show commands

## Troubleshooting

**Bot not responding in chat?**
- Check `KICK_CHANNEL_ID` is correct
- Verify `API_BASE_URL` is accessible
- Check Railway logs for errors

**Messages not appearing in admin panel?**
- Verify Slot Calls is OPEN in the admin panel
- Check that `BOT_SECRET` matches in both Vercel and Railway
- Review database for errors in `/api/bot/slot-calls` logs
