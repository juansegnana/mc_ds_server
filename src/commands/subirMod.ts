import { SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .addAttachmentOption((option) =>
      option
        .setName("mod_file")
        .setDescription("Archivo del mod a subir, debe ser un .jar")
        .setRequired(true)
    )
    .setName("subir_mod")
    .setDescription(`Subir un mod nuevo al servidor de MC`),

  async execute(interaction) {
    const server = new Server();
    // Get attachment and upload to server
    const attachment = interaction.options.get("mod_file");
    const attachmentObj = attachment?.attachment;

    if (!attachment || !attachmentObj) {
      await interaction.reply("No se pudo subir el mod :(");
      return;
    }
    const fileName = attachmentObj.name || "mod.jar";
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
