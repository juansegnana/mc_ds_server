import Consumer from "./Consumer";
import Client from "ssh2-sftp-client";
import archiver from "archiver";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  FileAttributes,
  IBackupList,
  ICompressFileResponse,
  IFileList,
  IFileToDownloadResponse,
  IServerDetails,
  IServerResources,
} from "./types";

import path from "path";

import {
  createReadStream,
  createWriteStream,
  mkdirSync,
  mkdtempSync,
  rmdirSync,
  unlinkSync,
} from "fs";
import { mkdir, unlink } from "fs/promises";

export type TServerState = "start" | "stop" | "restart" | "kill";

type TServerCurrentState = FileAttributes["current_state"];

interface IListModsProps {
  sortAlphabetically?: boolean;
}

class Server {
  apiKey: string;
  serverUrl: string;
  serverId: string;
  axios: Consumer;
  shouldDebug: boolean;

  constructor({ debug }: { debug?: boolean } = {}) {
    this.apiKey = process.env.SERVER_API_KEY ?? "";
    this.serverUrl = process.env.SERVER_URL ?? "";
    this.serverId = process.env.SERVER_ID ?? "";
    this.shouldDebug = debug ?? process.env.SHOULD_DEBUG === "true";

    if (!this.apiKey || !this.serverUrl || !this.serverId) {
      throw new Error("Missing environment variables!");
    }

    this.shouldDebug &&
      console.log("[Server] Loaded environment variables: ", {
        serverUrl: this.serverUrl,
        serverId: this.serverId,
      });

    this.axios = new Consumer({
      serverUrl: this.serverUrl,
      apiKey: this.apiKey,
    });
  }

  async getServerInfo() {
    const { data } = await this.axios.get<IServerDetails>(
      `client/servers/${this.serverId}`
    );
    this.shouldDebug && console.log("[Server] Server Info: ", data);
    return data;
  }

  async getServerStats() {
    const { data } = await this.axios.get<IServerResources>(
      `client/servers/${this.serverId}/resources`
    );
    this.shouldDebug && console.log("[Server] Server Stats: ", data);
    return data;
  }

  async changeServerState(state: TServerState) {
    const { status } = await this.axios.post(
      `client/servers/${this.serverId}/power`,
      { signal: state }
    );
    this.shouldDebug &&
      console.log(
        "[Server] NEW Server State: ",
        state,
        ". Response Code:",
        status
      );
    const SUCCESSFUL_STATUS = 204;
    return status === SUCCESSFUL_STATUS;
  }

  async sendCommand(command: string) {
    const { data, status } = await this.axios.post(
      `client/servers/${this.serverId}/command`,
      { command }
    );
    this.shouldDebug &&
      console.log("[Server] Command: ", command, ". Response Code:", status);
    return data;
  }

  async getServerState(): Promise<TServerCurrentState> {
    const data = await this.getServerStats();
    const state = data.attributes.current_state;
    this.shouldDebug && console.log("[Server] Server State: ", state);
    return state;
  }

  async listFiles(): Promise<IFileList> {
    const { data } = await this.axios.get<IFileList>(
      `client/servers/${this.serverId}/files/list?directory=%2Fcache`
    );
    return data;
  }

  async getUploadFileUrl(): Promise<string> {
    const { data } = await this.axios.get<{
      object: string;
      attributes: { url: string };
    }>(`client/servers/${this.serverId}/files/upload`);
    return `${data.attributes.url}`;
  }

  async uploadMod(fileName: string, fileUrl: string): Promise<boolean> {
    const endpoint = `client/servers/${this.serverId}/files/write`; // await this.getUploadFileUrl();
    const { data, status } = await this.axios.uploadFile(
      endpoint,
      fileName,
      fileUrl
    );
    return status !== 400;
  }

  /**
   * @deprecated - Use `startWorldBackup` instead
   */
  async backupWorld(): Promise<{ downloadUrl: string; filePath?: string }> {
    console.log("Starting world backup...");

    const { data: fileCompressed } =
      await this.axios.post<ICompressFileResponse>(
        `client/servers/${this.serverId}/files/compress`,
        {
          root: "/",
          files: ["world"],
        }
      );

    if (!fileCompressed) {
      throw new Error("No data returned from compress world file!");
    }

    const pathEncoded = encodeURIComponent(`${fileCompressed.attributes.name}`);
    console.log(`pathEncoded: ${pathEncoded}`);

    const { data: fileToDownload } =
      await this.axios.get<IFileToDownloadResponse>(
        `client/servers/${this.serverId}/files/download?file=${pathEncoded}`
      );
    const downloadUrl = fileToDownload.attributes.url;

    if (!downloadUrl) {
      throw new Error("No download url returned from compress world file!");
    }

    if (!!process.env.RAILWAY_ENVIRONMENT) {
      return { downloadUrl };
    }

    const filePath = await this.axios.downloadFile(
      fileCompressed.attributes.name,
      downloadUrl
    );
    console.log(`File path is ${filePath}`);

    return { filePath, downloadUrl };
  }

  async listMods(sortAlphabetically = true): Promise<string[]> {
    const { data: filesArr } = await this.axios.get<IFileList>(
      `client/servers/${this.serverId}/files/list?directory=%2Fmods`
    );

    if (!filesArr || !filesArr?.data || !filesArr?.data?.length) {
      throw new Error("No data returned from mod list!");
    }

    const modList = filesArr.data.map((file) => file.attributes.name);
    return sortAlphabetically
      ? modList.sort((a, b) => a.localeCompare(b))
      : modList;
  }

  // Backup
  async startWorldBackup(): Promise<IBackupList[]> {
    // Stop auto-saving if server is running
    const serverState = await this.getServerState();
    const isServerRunning = serverState === "running";
    if (isServerRunning) {
      // Send command set auto-save off
      await this.sendCommand("say Comenzando backup...");
      await this.sendCommand("save-off");
      await this.sendCommand("save-all");

      // Wait for server to save
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // Backup world
    const sftp = new SFTPClient();
    const response = await sftp.downloadFolder();

    if (isServerRunning) {
      await this.sendCommand("save-on");
      await this.sendCommand("say Backup completado!");
    }

    return response;
  }
}

export default Server;

interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export class SFTPClient {
  private sftp: Client;
  private credentials: SFTPConfig;

  constructor() {
    this.sftp = new Client();
    const sftpPort = process.env.SFTP_PORT;
    const sftpLink = process.env.SFTP_LINK;
    const sftpUser = process.env.SFTP_USERNAME;
    const sftpPass = process.env.SFTP_PASSWORD;

    if (!sftpPort || !sftpLink || !sftpUser || !sftpPass) {
      throw new Error("Missing SFTP environment variables");
    }

    this.credentials = {
      host: sftpLink,
      port: +sftpPort,
      username: sftpUser,
      password: sftpPass,
    };
  }
  async connect() {
    console.log("Connecting to SFTP server...");
    // console.log("credentials?", this.credentials);

    await this.sftp.connect(this.credentials);
  }

  async disconnect() {
    await this.sftp.end();
  }

  async downloadFolder(serverFolderPath: string = "/world") {
    console.log("starting download and upload to DB...");

    const temporalFolder = path.join(__dirname, "..", "temp");
    const backupTempFolderPath = mkdtempSync(
      path.join(temporalFolder, `world-`)
    );

    console.log("Downloading world folder from SFTP server...");
    await this.connect();
    await this.sftp.downloadDir(serverFolderPath, backupTempFolderPath, {
      useFastget: true,
    });
    await this.disconnect();
    console.log("World folder downloaded from SFTP server!");

    console.log("Compressing world folder...");

    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("end", function () {
      console.log("Archive wrote %d bytes", archive.pointer());
    });
    archive.directory(backupTempFolderPath, false);

    const backupZipFile = path.join(
      temporalFolder,
      `world-${new Date().getUTCFullYear()}.zip`
    );
    archive.pipe(createWriteStream(backupZipFile));
    await archive.finalize();
    console.log("World folder compressed!");

    try {
      await this.uploadToDatabase(backupZipFile);
    } catch (error) {
      console.log("Error uploading zip to DB", error);
    }

    console.log("Deleting temporary files...");
    // Delete temporary files
    rmdirSync(backupTempFolderPath, { recursive: true });
    unlinkSync(backupZipFile);
    console.log("Temporary files deleted!");
    // TODO: return download url
    return await this.getDownloadLink();
  }

  async uploadToDatabase(
    zipPath = path.join(__dirname, "..", "temp", "world-2022.zip")
  ) {
    const client = new S3Client({ region: "sa-east-1" });

    const listCommand = new ListObjectsCommand({
      Bucket: "mc-js-backups",
    });

    const listData = await client.send(listCommand);
    console.log("Success", listData);

    // If there is more than 10 objects with `world` key, delete the oldest one
    if (listData.Contents?.length && listData.Contents.length > 10) {
      const worldObjects = listData.Contents.filter((object) =>
        object.Key?.includes("world")
      );
      console.log("There is more than 10 objects, deleting the oldest one");
      const oldestObject = worldObjects[0];
      console.log("Deleting oldest object", oldestObject.Key);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: "mc-js-backups",
        Key: oldestObject.Key,
      });

      const deleteData = await client.send(deleteCommand);
      console.log("Success", deleteData);
    } else {
      console.log("There is less than 10 world backups");
    }

    const command = new PutObjectCommand({
      Bucket: "mc-js-backups",
      Key: `world-${new Date().toISOString()}.zip`,
      Body: createReadStream(zipPath),
    });

    let data: PutObjectCommandOutput | null = null;

    try {
      data = await client.send(command);
      // console.log("Success", data);
      console.log(`Se subio con etag: ${data.ETag}`);
    } catch (err) {
      console.log("Error", err);
    }

    return data;
  }

  async getDownloadLink() {
    const client = new S3Client({ region: "sa-east-1" });
    const listCommand = new ListObjectsCommand({
      Bucket: "mc-js-backups",
    });

    const listData = await client.send(listCommand);
    // console.log("Success", listData);

    // Get download link for each object
    const worldObjects = listData.Contents?.filter((object) =>
      object.Key?.includes("world")
    );

    if (!worldObjects) return [];

    const downloadLinks: IBackupList[] = [];

    for (const object of worldObjects) {
      async function getSignedFileUrl(
        fileName: string,
        bucket: string,
        expiresIn: number
      ) {
        const command = new GetObjectCommand({
          Bucket: bucket,
          Key: fileName,
        });

        return await getSignedUrl(client, command, { expiresIn });
      }

      const signedUrl = await getSignedFileUrl(
        object.Key || "world.zip",
        "mc-js-backups",
        // 5 minutes
        60 * 1 * 5
      );

      downloadLinks.push({
        key: object.Key || "world.zip",
        url: signedUrl,
        lastModifiedBy: object.LastModified || new Date(),
      });
    }

    return downloadLinks;
  }
}
