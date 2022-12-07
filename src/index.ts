import dotenv from "dotenv";
import Server from "./MCServer";

dotenv.config();

const main = async () => {
  const server = new Server();
  const state = await server.getServerState();
  console.log("the server is...", state);
};

main();
