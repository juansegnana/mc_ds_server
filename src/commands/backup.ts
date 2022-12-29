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

    // Embed displaying each file with its link
    const embed = {
      title: "Descargar backups",
      description: "Backups de mundos. Los links expiran en 5 minutos.",
      color: 0x0099ff,
      // sort from newest to oldest
      fields: response
        .sort((a, b) => b.lastModifiedBy.getTime() - a.lastModifiedBy.getTime())
        .map((file) => {
          return {
            name: file.key,
            value: `[Link de descarga](${file.url})`,
          };
        }),
      timestamp: new Date().toISOString(),
    };

    await interaction.editReply({ embeds: [embed] });
  },
};

// Export
export = command;
