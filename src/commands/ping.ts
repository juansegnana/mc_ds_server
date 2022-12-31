import { SlashCommandBuilder } from "discord.js";
import { ECommands } from "../commands";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(ECommands.Ping)
    .setDescription("Shows the bot's ping"),
  async execute(interaction) {
    await interaction.reply(
      `🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`
    );
  },
};

// Export
export = command;
