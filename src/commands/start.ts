import { SlashCommandBuilder } from "discord.js";
import { ECommands } from "../commands";
import handleServerChandeState from "../helpers/handleServerChangeState";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(ECommands.Start)
    .setDescription(`Arranca servidor de MC`),
  async execute(interaction) {
    await interaction.reply("Arrancando servidor...");
    const response = await handleServerChandeState(interaction.client, "start");
    let message: string = "...";

    if (response) {
      message = `El servidor está arrancando, esperá ~1 minuto`;
    } else {
      message = `El servidor ya está arrancando o prendido`;
    }

    await interaction.editReply(message);
  },
};

// Export
export = command;
