import dotenv from "dotenv";
dotenv.config();
import { SFTPClient } from "./MCServer";

const main = async () => {
  const sftp = new SFTPClient();
  await sftp.connect();
  await sftp.compressFile("/world");
  await sftp.disconnect();
};

main();
