import { ActivityType, Client } from "discord.js";
import Server, { TServerState } from "../MCServer";

async function updateBotPresence(
  cl: Client,
  newState?: TServerState,
  checkServerState = true
) {
  let serverState = "";
  if (checkServerState) {
    const server = new Server();
    serverState = await server.getServerState();

    if (newState && newState !== serverState) {
      console.log(
        `Diff current server state with new state: ${serverState} vs ${newState}`
      );
    }

    console.log(`Updating server status. Current status is ${serverState}`);
  }

  const finalState = newState ?? serverState;

  cl.user?.setPresence({
    activities: [
      {
        name: `${finalState}`,
        type: ActivityType.Listening,
      },
    ],
  });
}

export default updateBotPresence;
