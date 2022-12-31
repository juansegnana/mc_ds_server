import { IBackupList } from "./types";

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
import path from "path";
import {
  createReadStream,
  createWriteStream,
  mkdtempSync,
  rmSync,
  unlinkSync,
} from "fs";

interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

class SFTPClient {
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
    await this.sftp.connect(this.credentials);
    console.log("Connected!");
  }

  async disconnect() {
    await this.sftp.end();
    console.log("Disconnected from SFTP server!");
  }

  async downloadFolder(
    serverFolderPath: string = "/world"
  ): Promise<IBackupList> {
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

    const fileUploaded: IBackupList = {
      key: "",
      lastModifiedBy: new Date(),
      url: "",
    };

    try {
      const response = await this.uploadToDatabase(backupZipFile);
      fileUploaded["key"] = response?.ETag?.replace(/"/g, "") || "";
      fileUploaded["lastModifiedBy"] = new Date();
    } catch (error) {
      console.log("Error uploading zip to DB", error);
    }

    console.log("Deleting temporary files...");
    // Delete temporary files
    rmSync(backupTempFolderPath, { recursive: true });
    unlinkSync(backupZipFile);
    console.log("Temporary files deleted!");

    const urlSigned = await this.getDownloadLink(fileUploaded["key"]);
    fileUploaded["url"] = urlSigned;

    return {
      ...fileUploaded,
    };
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
      ).sort((a, b) => {
        // Sort by last modified date (oldest first)
        if (a.LastModified && b.LastModified) {
          return a.LastModified.getTime() - b.LastModified.getTime();
        }
        return 0;
      });

      console.log("There is more than 10 objects, deleting the oldest one");
      const oldestObject = worldObjects[0];
      console.log("Deleting oldest object", oldestObject.Key);
      const deleteCommand = new DeleteObjectCommand({
        Bucket: "mc-js-backups",
        Key: oldestObject.Key,
      });

      const deleteData = await client.send(deleteCommand);
      console.log("Data deleted - ", deleteData);
    }

    const command = new PutObjectCommand({
      Bucket: "mc-js-backups",
      Key: `world-${new Date().toISOString()}.zip`,
      Body: createReadStream(zipPath),
    });

    let data: PutObjectCommandOutput | null = null;

    try {
      data = await client.send(command);
      console.log(`Uploaded with eTag: ${data.ETag}`);
    } catch (err) {
      console.log("Error uploading file", err);
    }

    return data;
  }

  async getDownloadLink(fileName: string) {
    const client = new S3Client({ region: "sa-east-1" });

    const signedUrl = await this.getSignedFileUrl({
      bucket: "mc-js-backups",
      client,
      // 5 minutes
      expiresIn: 60 * 1 * 5,
      fileName,
    });

    return signedUrl;
  }

  async getAllDownloadLink() {
    const client = new S3Client({ region: "sa-east-1" });

    const listCommand = new ListObjectsCommand({
      Bucket: "mc-js-backups",
    });
    const listData = await client.send(listCommand);

    const worldObjects = (listData.Contents || []).filter((object) =>
      object.Key?.includes("world")
    );
    if (!worldObjects) return [];

    const downloadLinks: IBackupList[] = [];

    for (const object of worldObjects) {
      const signedUrl = await this.getSignedFileUrl({
        bucket: "mc-js-backups",
        client,
        // 5 minutes
        expiresIn: 60 * 1 * 5,
        fileName: object.Key || "world.zip",
      });

      downloadLinks.push({
        key: object.Key || "world.zip",
        url: signedUrl,
        lastModifiedBy: object.LastModified || new Date(),
      });
    }

    return downloadLinks;
  }

  async getSignedFileUrl({
    bucket,
    client,
    expiresIn,
    fileName,
  }: IGetSignedUrl): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    });

    return await getSignedUrl(client, command, { expiresIn });
  }
}

interface IGetSignedUrl {
  client: S3Client;
  fileName: string;
  bucket: string;
  expiresIn: number;
}

export default SFTPClient;
