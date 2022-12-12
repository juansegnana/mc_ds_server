import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows the bot's ping"),
  async execute(interaction) {
    await interaction.reply(
      `🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`
    );
  },
};

// Export
export = command;
