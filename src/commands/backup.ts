import { SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("backup")
    .setDescription(`Hace un backup del mundo de MC`),
  async execute(interaction) {
    await interaction.reply("Haciendo backup...");
    const server = new Server();
    const response = await server.backupWorld();

    // If bot is in server, will responde with an URL to download the world
    // else will send the file path where is located (if local).
    const MESSAGE = `Se guardó el backup en el servidor. Descarga el archivo desde:\n${response.downloadUrl}`;

    await interaction.editReply("```" + MESSAGE + "```");
  },
};

// Export
export = command;
