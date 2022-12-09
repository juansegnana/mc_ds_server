import fs from "fs";
import path from "path";
// Require the necessary discord.js classes
import {
  ActivityType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
} from "discord.js";

import { Command } from "./types";
import Server from "./MCServer";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not defined");
}

class DiscordClient extends Client {
  public commands: Collection<string, Command>;

  constructor() {
    super({ intents: [GatewayIntentBits.Guilds] });
    this.commands = new Collection();
  }
}

// Create a new client instance
const client = new DiscordClient();

client.commands = new Collection();

const commandsPath = path.join(__dirname, "./", "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, (c) => {
  console.log(
    `Ready! Logged in as ${c.user.tag}. In guilds: ${c.guilds.cache
      .map((g) => g.id)
      .join(", ")}`
  );
  updateBotActivity();
});

async function updateBotActivity() {
  const server = new Server();
  const serverState = await server.getServerState();
  console.log(`Updating server status. Current status is ${serverState}`);
  client.user?.setPresence({
    activities: [
      {
        name: `Estado server: ${serverState}`,
        type: ActivityType.Listening,
      },
    ],
  });
}

// Each 5 minutes, update MC server status
setInterval(() => updateBotActivity(), 1000 * 60 * 5);

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);
  // console.log('getting...', interaction.client.commands.forEach((c) => console.log(c.name)));
  if (!command) {
    console.error(
      `No command matching "${interaction.commandName}" was found.`
    );
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error while executing this command!",
      ephemeral: true,
    });
  }
});

// Log in to Discord with your client's token
client.login(BOT_TOKEN);
