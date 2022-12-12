import { Client } from "discord.js";
import Server, { TServerState } from "../MCServer";
import updateBotPresence from "./updateBotPresence";

async function handleServerChandeState(client: Client, newState: TServerState) {
  const server = new Server();
  const serverState = await server.getServerState();

  switch (newState) {
    case "start":
      if (serverState === "running") {
        return false;
      }
      break;
    case "stop":
    case "restart":
      if (serverState === "offline") {
        return false;
      }
      break;
    default:
      return false;
  }

  const isServerUpdated = await server.changeServerState(newState);
  if (!isServerUpdated) return false;

  await updateBotPresence(client, newState);
  return true;
}

export default handleServerChandeState;
