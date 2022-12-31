import { ECommands } from "../commands";
import { SlashCommand } from "../types";
import { SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(ECommands.Cambiar)
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
    if (!action) {
      await interaction.reply("Hubo un error :(");
      return;
    }
    const { name, type, value } = action;
    const actionValue = value as "start" | "stop" | "restart";
    console.log(`interaction option log: [${name}, ${type}, ${value}]`);

    const server = new Server();
    const response = await server.changeServerState(actionValue);

    await interaction.reply(
      `Mandé el comando \`${actionValue}\` al server! Respuesta: \`${response}\`.`
    );
  },
};

// Export
export = command;
