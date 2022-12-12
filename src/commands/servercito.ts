import { SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("servercito")
    .setDescription("Tira informacion del server de MC"),
  async execute(interaction) {
    const server = new Server();
    const serverDetails = await server.getServerState();

    await interaction.reply(
      `El server actualmente esta en modo: "${serverDetails}"`
    );
  },
};
// Export
export = command;
