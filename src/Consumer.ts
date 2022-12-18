import axios from "axios";
import EventEmitter from "events";
import path from "path";

import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "fs";

interface IConsumer {
  serverUrl: string;
  apiKey: string;
}

type IAxiosResponse<T> = { data: T; status: number };

class Consumer implements IConsumer {
  serverUrl: string;
  apiKey: string;
  config: {
    headers: Record<string, string>;
    baseURL: string;
  };
  eventEmitter: EventEmitter;

  constructor({ serverUrl: endpoint, apiKey }: IConsumer) {
    this.serverUrl = endpoint;
    this.apiKey = apiKey;
    this.config = {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      baseURL: this.serverUrl,
    };
    this.eventEmitter = new EventEmitter();
  }

  async get<T>(endpoint: string): Promise<IAxiosResponse<T>> {
    const { data, status } = await axios.get<T>(endpoint, this.config);
    return { data, status };
  }

  async post<T>(
    endpoint: string,
    payload: Record<string, any>
  ): Promise<IAxiosResponse<T>> {
    const { data, status } = await axios.post<T>(
      endpoint,
      payload,
      this.config
    );
    return { data, status };
  }

  async downloadFile(fileName: string, endpoint: string): Promise<string> {
    const { data, status } = await axios.get<Buffer>(endpoint, {
      responseType: "arraybuffer",
    });
    console.log("got file downloaded?", status);

    if (!data) {
      throw new Error("No data returned from downloadFile");
    }
    if (!fileName) {
      throw new Error("Invalid file name");
    }
    try {
      const pathFolder = path.join(__dirname, "temporal");
      const pathFile = path.join(pathFolder, `${fileName}`);

      if (!existsSync(pathFolder)) {
        mkdirSync(pathFolder);
      }

      writeFileSync(pathFile, data, { flag: "w" });
      return pathFile;
    } catch (e) {
      console.error(`Error downloading file: "${fileName}". Error: ${e}`);
      return "";
    }
  }

  async uploadFile(
    endpoint: string,
    fileName: string,
    downloadUrl: string
  ): Promise<IAxiosResponse<Record<string, any>>> {
    console.log("got endpoint:", endpoint);

    const filePath = await this.downloadFile(fileName, downloadUrl);
    const SERVER_FILE_PATH = `${endpoint}?file=${encodeURIComponent(
      `mods/${fileName}`
    )}`;
    console.log("SERVER_FILE_PATH", SERVER_FILE_PATH);

    let response = { data: {}, status: 400 };
    try {
      const buffer = readFileSync(filePath);
      const fileContent = buffer.toString();

      const { data, status } = await this.post<Record<string, any>>(
        SERVER_FILE_PATH,
        {
          body: fileContent,
        }
      );

      response = { data, status };
    } catch (e) {
      console.error(`Error uploading file: "${fileName}". Error: ${e}`);
    } finally {
      this.removeTemporalFile(filePath);
    }
    return response;
  }

  removeTemporalFile(filePath: string) {
    console.log(`Removing temporal file at: "${filePath}"`);
    return unlinkSync(filePath);
  }

  // EVENTS handler. TODO: move to an own class
  async emitEvent(event: string, payload: Record<string, any>) {
    this.eventEmitter.emit(event, payload);
  }

  async clearEvents() {
    this.eventEmitter.removeAllListeners();
  }
}

export default Consumer;
