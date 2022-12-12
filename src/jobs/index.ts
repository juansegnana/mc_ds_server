import { Client } from "discord.js";
import { schedule } from "node-cron";
import updateBotPresence from "../helpers/updateBotPresence";

// Entre semana y solo de 21 a 23 hs, chequear cada 5 minutos.
const WEEK_DAYS = '*/5 21-23 * * 1-5'

const main = async (discordClient: Client) => {
  schedule(WEEK_DAYS, async () => {
    // console.log('[cron-job] Weekdays - Updating presence...');
    await updateBotPresence(discordClient); 
  }, {
    scheduled: true,
    timezone: "America/Sao_Paulo"
  });

  console.log(`[jobs] Started cron jobs`);
}

export default main;