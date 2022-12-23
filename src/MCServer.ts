import Consumer from "./Consumer";
import Client from "ssh2-sftp-client";

import {
  FileAttributes,
  ICompressFileResponse,
  IFileList,
  IFileToDownloadResponse,
  IServerDetails,
  IServerResources,
} from "./types";

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

  // Backup
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

    // TODO: Delete older files if > 10 backups
    // const { status } = await this.axios.post(
    //   `client/servers/${this.serverId}/files/delete`,
    //   {
    //     root: "/",
    //     files: [pathEncoded],
    //   }
    // );

    // if (status !== 204) {
    //   console.log(
    //     `[mc-server] Failed to delete file from server! File: "${pathEncoded}"`
    //   );
    // }

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
    console.log("credentials?", this.credentials);

    await this.sftp.connect(this.credentials);
  }
  // const data = await sftp.list("/world");
  // console.log(data, `the data info: ${data}`);
  async disconnect() {
    await this.sftp.end();
  }

  async compressFile(filePath: string) {
    // const data = await this.sftp.list("/world");
    // console.log(data, `the data info: ${data}`);
    this.sftp.(`tar -czvf /path/to/compressed/file.tar.gz /path/to/folder`, { cwd: '/path/to/folder' }).then((result) => {
      console.log(result);
    });
  }

  // TODO:
  // Compress `/world` folder
  // Download the compressed file to `/temp` folder
  // Upload the compressed file to Cloudinary
  // Delete the compressed file from `/temp` folder
  // Return the Cloudinary file download URL

  //   await sftp.end();
  // }
}
