import { SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription(`Apagar servidor de MC`),
  async execute(interaction) {
    const server = new Server();
    const serverDetails = await server.getServerState();

    let message = "Cargando...";

    if (serverDetails === "running") {
      await server.changeServerState("stop");
      message = `El servidor se está apagando, suele tardar 30 segundos...`;
    } else {
      message = `El servidor ya está en modo: "${serverDetails}"`;
    }

    await interaction.reply(message);
  },
};
// Export
export = command;
