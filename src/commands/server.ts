import { SlashCommandBuilder } from "discord.js";
import { ECommands } from "../commands";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(ECommands.Server)
    .setDescription("Provides information about the server."),
  async execute(interaction: any) {
    // interaction.guild is the object representing the Guild in which the command was run
    await interaction.reply(
      `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`
    );
  },
};
// Export
export = command;
