import axios from "axios";

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
}

export default Consumer;