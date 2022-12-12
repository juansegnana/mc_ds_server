import { SlashCommandBuilder } from "discord.js";
import handleServerChandeState from "../helpers/handleServerChangeState";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription(`Apagar servidor de MC`),
  async execute(interaction) {
    await interaction.reply("Arrancando servidor...");
    const response = await handleServerChandeState(interaction.client, "stop");
    let message: string = "...";

    if (response) {
      message = `El servidor se está apagando. Aprox. ~ 15 segundos`;
    } else {
      message = `El servidor ya está apagado`;
    }

    await interaction.editReply(message);
  },
};
// Export
export = command;
