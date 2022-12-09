import { SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription(`Arranca servidor de MC`),
  async execute(interaction) {
    const server = new Server();
    const serverDetails = await server.getServerState();

    let message = "Cargando...";

    if (serverDetails === "offline") {
      await server.changeServerState('start');
      message = `El servidor está arrancando, esperá entre 1-2 minutos`;
    } else {
      message = `El servidor ya está en modo: "${serverDetails}"`;
    }

    await interaction.reply(message);
  },
};
// Export
export = command;
