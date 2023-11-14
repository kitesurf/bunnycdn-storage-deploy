import {
  getInput,
  setOutput,
  setFailed,
  info,
  getBooleanInput,
} from "@actions/core";
import fetch from "node-fetch";

type Params = {
  storageZoneId: number;
  replicationRegions: string[];
  rewrite404To200: boolean;
  custom404FilePath: string;
  accessKey: string;
};

class Main {
  private params: Params;

  constructor() {
    this.params = this.getParams();
  }

  async run() {
    try {
      await this.createStorage();
    } catch (error) {
      setFailed(error as string | Error);
    }
  }

  private getParams(): Params {
    const result = {
      storageZoneId: parseInt(
        getInput("storageZoneId", { required: true }),
        10
      ),
      replicationRegions: getInput("replicationRegions")
        .split(",")
        .map((region) => region.trim()),
      rewrite404To200: getBooleanInput("rewrite404To200"),
      custom404FilePath: getInput("custom404FilePath"),
      accessKey: getInput("accessKey", { required: true }),
    };

    return result;
  }

  private async createStorage() {
    if (!this.params.storageZoneId) {
      throw new Error("Can't update, storageZoneId was not set.");
    }

    info(`Update storage zone with the id ${this.params.storageZoneId}`);

    const url = `https://api.bunny.net/storagezone/${this.params.storageZoneId}`;
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        AccessKey: this.params.accessKey,
      },
      body: JSON.stringify({
        ReplicationRegions: this.params.replicationRegions || undefined,
        Rewrite404To200: this.params.rewrite404To200,
        Custom404FilePath: this.params.custom404FilePath || undefined,
      }),
    };

    const [status, data] = await fetch(url, options).then((res) =>
      Promise.all([
        res.status,
        res.json() as Promise<{ Id: string; Name: string; Password: string }>,
      ])
    );
    if (status !== 204) {
      if (status === 400) {
        info(`Status 400: ${JSON.stringify(data)}`);
      }
      throw new Error(`Updating failed with the status code ${status}.`);
    }
    info(`Storage zone successfully updated`);
  }
}

new Main().run();
