import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("listar_mods")
    .setDescription(`Lista los mods disponibles en el Server`),

  async execute(interaction) {
    await interaction.reply("Buscando mods...");
    const server = new Server();
    const mods = await server.listMods();

    const CODE_FORMAT = "```";
    const embed = new EmbedBuilder()
      .setTitle("Mods disponibles")
      .setAuthor({
        name: "MC Server",
      })
      .setTimestamp()
      .setColor("#0099ff")
      .setDescription(
        `Hay un total de ${
          mods.length
        } mods instalados.\n${CODE_FORMAT}${mods.join("\n")}${CODE_FORMAT}`
      );

    // Reply an embed response
    await interaction.editReply({
      embeds: [embed],
    });
  },
};

// Export
export = command;
