import { ActivityType, Client } from "discord.js";
import Server, { TServerState } from "../MCServer";

async function updateBotPresence(
  cl: Client,
  newState?: TServerState,
  checkServerState = true
) {
  let serverState = "";
  if (!checkServerState) {
    const server = new Server();
    const serverState = await server.getServerState();

    if (newState && newState !== serverState) {
      console.log(
        `Diff current server state with new state: ${serverState} vs ${newState}`
      );
    }

    console.log(`Updating server status. Current status is ${serverState}`);
  }

  cl.user?.setPresence({
    activities: [
      {
        name: `${newState ?? serverState}`,
        type: ActivityType.Playing,
      },
    ],
  });
}

export default updateBotPresence;
