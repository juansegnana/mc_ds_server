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
    const response = await server.startWorldBackup();

    const message = [
      `*Último backup del mundo*. El link expira en _5 minutos_!`,
      `---`,
      `_Archivo_: ${response.key}`,
      `*[Link](${response.url})*`,
      `Subido a las ${response.lastModifiedBy.toLocaleString()}`,
      `---`,
    ].join("\n");

    const embed = {
      title: "Descargar backup",
      description: message,
      color: 0x0099ff,
      timestamp: new Date().toISOString(),
    };

    await interaction.followUp({ embeds: [embed] });
  },
};

// Export
export = command;
