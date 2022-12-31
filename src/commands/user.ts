import { SlashCommandBuilder } from "discord.js";
import { ECommands } from "../commands";
import { SlashCommand } from "../types";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName(ECommands.User)
    .setDescription("Provides information about the user."),
  async execute(interaction: any) {
    await interaction.reply(
      `This command was run by ${interaction.user.username}, who joined on ${interaction.member.joinedAt}.`
    );
  },
};

export = command;
