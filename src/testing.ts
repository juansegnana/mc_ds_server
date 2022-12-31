import dotenv from "dotenv";
import SFTPClient from "./SFTP";
dotenv.config();

const main = async () => {
  const sftp = new SFTPClient();
  // await sftp.connect();
  await sftp.downloadFolder("/world");
  // await sftp.uploadToDatabase();
  const links = await sftp.getAllDownloadLink();
  console.log("got links", links);
  // await sftp.disconnect();
};

main();
