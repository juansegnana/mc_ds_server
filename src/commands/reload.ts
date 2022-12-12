import { SlashCommandBuilder } from "discord.js";
import handleServerChandeState from "../helpers/handleServerChangeState";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription(`Reiniciar servidor de MC`),
  async execute(interaction) {
    await interaction.reply("Recargando servidor...");
    const response = await handleServerChandeState(
      interaction.client,
      "restart"
    );
    let message: string = "...";

    if (response) {
      message = `El servidor se está reinciando, esperá ~1 minuto`;
    } else {
      message = `El servidor no está prendido!`;
    }

    await interaction.editReply(message);
  },
};

// Export
export = command;
