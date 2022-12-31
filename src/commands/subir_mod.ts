import { SlashCommandBuilder } from "discord.js";
import { ECommands } from "../commands";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const MOD_FILE_COMMAND = "mod_file";
const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .addAttachmentOption((option) =>
      option
        .setName(MOD_FILE_COMMAND)
        .setDescription("Archivo del mod a subir, debe ser un .jar")
        .setRequired(true)
    )
    .setName(ECommands.SubirMod)
    .setDescription(`Subir un mod nuevo al servidor de MC`),

  async execute(interaction) {
    const server = new Server();
    // Get attachment and upload to server
    const attachment = interaction.options.get(MOD_FILE_COMMAND);
    const attachmentObj = attachment?.attachment;

    if (!attachment || !attachmentObj) {
      await interaction.reply("No se pudo subir el mod :(");
      return;
    }
    const fileName =
      attachmentObj.name || `mod-${new Date().toISOString()}.jar`;
    const fileUrl = attachmentObj.url || "";
    // await interaction.reply(`Subiendo archivo ${fileName}...`);
    await interaction.deferReply();

    try {
      const response = await server.uploadMod(fileName, fileUrl);
      console.log("response from uploading a new mod?", response);
      await interaction.editReply(
        `${!response ? "No se pudo subir" : "Se subio"} el mod "${fileName}"!`
      );
    } catch (e) {
      console.error("Error uploading mod", e);
      await interaction.editReply(`No se pudo subir el mod :( - Error: ${e}`);
    }
    return;
  },
};
// Export
export = command;
