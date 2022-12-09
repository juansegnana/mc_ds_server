import axios from "axios";
import { readFile, unlink, writeFile } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import FormData from "form-data";

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
    if (!data) {
      throw new Error("No data returned from downloadFile");
    }
    if (!fileName) {
      throw new Error("Invalid file name");
    }
    const pathFile = path.join(
      __dirname,
      "temporal",
      `${new Date().toJSON()}-${fileName}`
    );
    await writeFile(pathFile, data);
    return pathFile;
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
    console.log('SERVER_FILE_PATH', SERVER_FILE_PATH)

    let response = { data: {}, status: 400 };
    try {
      const buffer = await readFile(filePath);
      const fileContent = buffer.toString();
      // const { data, status } = await axios.post<Record<string, any>>(
      //   endpoint,
      //   formData,
      //   {
      //     headers: {
      //       ...formData.getHeaders(),
      //       // file: createReadStream(filePath),
      //       "Content-Type": "multipart/form-data",
      //     },
      //   }
      // );
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
      await this.removeTemporalFile(filePath);
    }
    return response;
  }

  async removeTemporalFile(filePath: string) {
    console.log(`Removing temporal file at: "${filePath}"`);
    return await unlink(filePath);
  }
}

export default Consumer;
