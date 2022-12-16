import fs from "fs";
import path from "path";

import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

import { Command } from "./types";
import updateBotPresence from "./helpers/updateBotPresence";
// import startCronJobs from "./jobs";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const adminUserIds: string[] = (process.env.ADMIN_USER_IDS ?? "")
  ?.split(",")
  .map((x) => `${x}`.trim())
  .filter((x) => x);

if (!BOT_TOKEN || !adminUserIds.length) {
  throw new Error("Discord envs are missing. Check `.env.sample` file!");
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
    `Ready! Logged in as "${c.user.tag}". In guilds:\n${c.guilds.cache
      .map((g) => g.id)
      .join("\n")}`
  );
  updateBotPresence(c);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(
      `No command matching "${interaction.commandName}" was found.`
    );
    return;
  }

  // Check if interaction is from a bot or is not an user allowed (adminUserIds)
  if (interaction.user.bot || !adminUserIds.includes(interaction.user.id)) {
    console.log(`[ds-bot] User ${interaction.user.id} tried to use a command!`);
    await interaction.reply({
      content: "No tienes permisos para ejecutar este comando!",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.log(
      `[ds-bot] Error executing command "${
        interaction.commandName
      }". Details: "${JSON.stringify(error)}"`
    );
    await interaction.reply({
      content: `Hubo un error ejecutando el comando! Detalles: "${JSON.stringify(
        error
      )}"`,
      ephemeral: true,
    });
  }
});

// Log in to Discord with your client's token
client.login(BOT_TOKEN);
// startCronJobs(client);
