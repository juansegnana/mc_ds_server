import { SlashCommandBuilder } from "discord.js";
import handleServerChandeState from "../helpers/handleServerChangeState";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("manejar")
    .setDescription(`Configura el estado del server`)
    .addStringOption((option) =>
      option
        .setName("accion")
        .setDescription("Que accion querés hacer?")
        .setRequired(true)
        .addChoices(
          { name: "Prender", value: "start" },
          { name: "Apagar", value: "stop" },
          { name: "Reiniciar", value: "restart" }
        )
    ),
  async execute(interaction) {
    // Get interaction choice
    const action = interaction.options.get("accion");
    console.log("got action", action);
    await interaction.reply("ok");
  },
};

// Export
export = command;
