import { REST, Routes } from 'discord.js'
import dotenv from 'dotenv';
import fs from 'fs'
import path from 'path'

dotenv.config()

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID!;

const COMMANDS_PATH = path.join(__dirname, '..', 'commands');

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  const commandPath = path.join(COMMANDS_PATH, file)
  console.log(`🚀 ~ file: registerSlashes.ts:22 ~ commandPath`, commandPath);
  
	const command = require(commandPath);
	commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID),
			{ body: commands },
		) as any[];

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();