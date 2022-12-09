import { SlashCommandBuilder } from "discord.js";
import Server from "../MCServer";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription(`Reiniciar servidor de MC`),
  async execute(interaction) {
    const server = new Server();
    const serverDetails = await server.getServerState();

    let message = "Cargando...";

    if (serverDetails === "running") {
      await server.changeServerState("restart");
      message = `El servidor se está reiniciando, suele tomar 1-2 minutos.`;
    } else {
      message = `El servidor no se esta ejecutando, estado actual: "${serverDetails}"`;
    }

    await interaction.reply(message);
  },
};
// Export
export = command;
