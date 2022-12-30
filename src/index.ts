import { existsSync, mkdirSync } from "fs";
import path from "path";

import dotenv from "dotenv";
dotenv.config();

import "./DiscordBot";

const TEMP_FOLDER = path.join(__dirname, "..", "temp");
if (!existsSync(TEMP_FOLDER)) {
  mkdirSync(TEMP_FOLDER);
}
