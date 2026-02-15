/**
 * R2K2 Tournament Kick Chat Bot
 * 
 * This bot listens to Kick chat and handles tournament commands:
 * - !enter <acebet_username> - Register for the tournament
 * - !slot <slot_name> <super/regular> - Submit slot call for your match
 * - !status - Get current tournament status
 * - !bracket - View remaining players
 * - !help - Show available commands
 * 
 * To run this bot, you'll need to:
 * 1. Install dependencies: npm install ws
 * 2. Set environment variables:
 *    - KICK_CHANNEL_ID: Your Kick channel ID
 *    - KICK_AUTH_TOKEN: Your Kick authentication token (if required)
 *    - API_BASE_URL: Your tournament API URL (e.g., https://www.r2k2.gg)
 *    - BOT_SECRET: Optional secret for API authentication
 * 3. Run: npx ts-node bot/kick-bot.ts
 */

import WebSocket from "ws";

const KICK_CHANNEL_ID = process.env.KICK_CHANNEL_ID || "";
const KICK_WS_URL = `wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false`;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000";
const BOT_SECRET = process.env.BOT_SECRET || "";

interface ChatMessage {
  id: string;
  chatroom_id: number;
  content: string;
  type: string;
  created_at: string;
  sender: {
    id: number;
    username: string;
    slug: string;
    identity: {
      color: string;
      badges: Array<{ type: string; text: string }>;
    };
  };
}

class KickTournamentBot {
  private ws: WebSocket | null = null;
  private channelId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(channelId: string) {
    this.channelId = channelId;
  }

  async connect() {
    console.log("[Bot] Connecting to Kick chat...");

    this.ws = new WebSocket(KICK_WS_URL);

    this.ws.on("open", () => {
      console.log("[Bot] Connected to Kick WebSocket");
      this.subscribeToChannel();
      this.reconnectAttempts = 0;
    });

    this.ws.on("message", (data: WebSocket.Data) => {
      this.handleMessage(data.toString());
    });

    this.ws.on("error", (error) => {
      console.error("[Bot] WebSocket error:", error);
    });

    this.ws.on("close", () => {
      console.log("[Bot] WebSocket closed");
      this.attemptReconnect();
    });
  }

  private subscribeToChannel() {
    if (!this.ws) return;

    // Subscribe to the chatroom channel
    const subscribeMessage = JSON.stringify({
      event: "pusher:subscribe",
      data: {
        auth: "",
        channel: `chatrooms.${this.channelId}.v2`,
      },
    });

    this.ws.send(subscribeMessage);
    console.log(`[Bot] Subscribed to channel: chatrooms.${this.channelId}.v2`);
  }

  private async handleMessage(data: string) {
    try {
      const message = JSON.parse(data);

      // Handle different event types
      if (message.event === "App\\Events\\ChatMessageEvent") {
        const chatData: ChatMessage = JSON.parse(message.data);
        await this.handleChatMessage(chatData);
      } else if (message.event === "pusher:subscription_succeeded") {
        console.log("[Bot] Successfully subscribed to channel");
      } else if (message.event === "pusher:ping") {
        // Respond to ping to keep connection alive
        this.ws?.send(JSON.stringify({ event: "pusher:pong", data: {} }));
      }
    } catch (error) {
      // Ignore parse errors for non-JSON messages
    }
  }

  private async handleChatMessage(message: ChatMessage) {
    const content = message.content.trim();
    const username = message.sender.username;

    // Check if it's a command
    if (!content.startsWith("!")) return;

    const [command, ...args] = content.slice(1).split(" ");

    console.log(`[Bot] Command from ${username}: ${command} ${args.join(" ")}`);

    switch (command.toLowerCase()) {
      case "enter":
        await this.handleEnter(username, args[0]);
        break;
      case "slot":
        // Join all args except the last one as slot name, last one is type
        const slotType = args.pop();
        const slotName = args.join(" ");
        await this.handleSlot(username, slotName, slotType);
        break;
      case "status":
        await this.handleStatus();
        break;
      case "bracket":
        await this.handleBracket();
        break;
      case "help":
        await this.handleHelp();
        break;
    }
  }

  private async handleEnter(kickUsername: string, acebetUsername?: string) {
    if (!acebetUsername) {
      console.log(`[Bot] ${kickUsername} tried to enter without Acebet username`);
      this.sendChatMessage(`@${kickUsername} Usage: !enter YourAcebetName`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kickUsername,
          acebetUsername,
          botSecret: BOT_SECRET,
        }),
      });

      const data = await response.json();
      console.log(`[Bot] Entry response: ${data.message}`);
      
      // Send the response to chat (Entry ACCEPTED or Entry DENIED)
      this.sendChatMessage(data.message);
    } catch (error) {
      console.error("[Bot] Error handling entry:", error);
      this.sendChatMessage(`@${kickUsername} Error processing entry. Please try again.`);
    }
  }

  private async handleSlot(kickUsername: string, slotName?: string, slotType?: string) {
    if (!slotName) {
      console.log(`[Bot] ${kickUsername} tried to submit slot without proper format`);
      this.sendChatMessage(`@${kickUsername} Usage: !slot <slot name> (e.g., !slot Gates of Olympus)`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/slot-calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kickUsername,
          slotName,
          botSecret: BOT_SECRET,
        }),
      });

      const data = await response.json();
      console.log(`[Bot] Slot call response: ${data.message}`);
      this.sendChatMessage(data.message);
    } catch (error) {
      console.error("[Bot] Error handling slot call:", error);
      this.sendChatMessage(`@${kickUsername} Error submitting slot call. Please try again.`);
    }
  }

  private async handleStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/status`);
      const data = await response.json();
      console.log(`[Bot] Status response: ${data.message}`);
      this.sendChatMessage(data.message);
    } catch (error) {
      console.error("[Bot] Error handling status:", error);
    }
  }

  private async handleBracket() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/bot/bracket`);
      const data = await response.json();
      console.log(`[Bot] Bracket response: ${data.message}`);
      this.sendChatMessage(data.message);
    } catch (error) {
      console.error("[Bot] Error handling bracket:", error);
    }
  }

  private handleHelp() {
    const helpMessage = `Tournament Commands: !enter <name> - Register | !slot <slot> - Submit slot call | !status - Info | !bracket - View players`;
    console.log(`[Bot] Help: ${helpMessage}`);
    this.sendChatMessage(helpMessage);
  }

  private sendChatMessage(message: string) {
    // Note: Sending messages to Kick chat requires additional API authentication
    // This is a placeholder - you'll need to implement the actual Kick send API
    console.log(`[Bot] Would send to chat: ${message}`);
    
    // If you have Kick API access for sending messages:
    // await fetch(`https://kick.com/api/v2/messages/send/${this.channelId}`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${KICK_AUTH_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ content: message })
    // });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[Bot] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`[Bot] Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Main entry point
async function main() {
  if (!KICK_CHANNEL_ID) {
    console.error("Error: KICK_CHANNEL_ID environment variable is required");
    process.exit(1);
  }

  console.log("=================================");
  console.log("  R2K2 Tournament Bot Starting");
  console.log("=================================");
  console.log(`Channel ID: ${KICK_CHANNEL_ID}`);
  console.log(`API URL: ${API_BASE_URL}`);
  console.log("");

  const bot = new KickTournamentBot(KICK_CHANNEL_ID);
  
  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n[Bot] Shutting down...");
    bot.disconnect();
    process.exit(0);
  });

  await bot.connect();
}

main().catch(console.error);
