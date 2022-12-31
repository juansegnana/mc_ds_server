import Consumer from "./Consumer";
import SFTPClient from "./SFTP";

import {
  FileAttributes,
  IBackupList,
  ICompressFileResponse,
  IFileList,
  IFileToDownloadResponse,
  IServerDetails,
  IServerResources,
} from "./types";

export type TServerState = "start" | "stop" | "restart" | "kill";
type TServerCurrentState = FileAttributes["current_state"];

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
  async startWorldBackup(): Promise<IBackupList> {
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
