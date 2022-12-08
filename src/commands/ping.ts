import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  // execute: interaction => {
  //     interaction.reply({
  //         embeds: [
  //             new EmbedBuilder()
  //             .setAuthor({name: "MRC License"})
  //             .setDescription(`🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`)
  //             // .setColor(getThemeColor("text"))
  //         ]
  //     })
  // },
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows the bot's ping"),
  async execute(interaction) {
    await interaction.reply(
      `🏓 Pong! \n 📡 Ping: ${interaction.client.ws.ping}`
    );
  },
};
// Export
export = command;