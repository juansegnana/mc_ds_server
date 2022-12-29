import dotenv from "dotenv";
dotenv.config();
import { SFTPClient } from "./MCServer";

const main = async () => {
  const sftp = new SFTPClient();
  // await sftp.connect();
  await sftp.downloadFolder("/world");
  // await sftp.uploadToDatabase();
  const links = await sftp.getDownloadLink();
  console.log("got links", links);
  // await sftp.disconnect();
};

main();
