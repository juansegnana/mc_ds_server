import {
  SlashCommandBuilder,
  CommandInteraction,
  Collection,
  PermissionResolvable,
  Message,
  AutocompleteInteraction,
} from "discord.js";

export interface Command {
  name: string;
  execute: (interaction: CommandInteraction) => Promise<void>;
  permissions: Array<PermissionResolvable>;
  aliases: Array<string>;
}

export interface SlashCommand {
  data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: CommandInteraction) => Promise<void>;
}

declare module "discord.js" {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

// Server
// Details
export interface IServerDetails {
  object: string;
  attributes: IServerDetailsAAttributes;
  meta: Meta;
}

interface IServerDetailsAAttributes {
  server_owner: boolean;
  identifier: string;
  uuid: string;
  name: string;
  node: string;
  sftp_details: SFTPDetails;
  description: string;
  limits: Limits;
  feature_limits: FeatureLimits;
  is_suspended: boolean;
  is_installing: boolean;
  relationships: Relationships;
}

interface FeatureLimits {
  databases: number;
  allocations: number;
  backups: number;
}

interface Limits {
  memory: number;
  swap: number;
  disk: number;
  io: number;
  cpu: number;
}

interface Relationships {
  allocations: Allocations;
}

interface Allocations {
  object: string;
  data: Datum[];
}

interface Datum {
  object: string;
  attributes: DatumAttributes;
}

interface DatumAttributes {
  id: number;
  ip: string;
  ip_alias: null;
  port: number;
  notes: null | string;
  is_default: boolean;
}

interface SFTPDetails {
  ip: string;
  port: number;
}

interface Meta {
  is_server_owner: boolean;
  user_permissions: string[];
}

// Resources
export interface IServerResources {
  object: string;
  attributes: Attributes;
}

export interface Attributes {
  current_state: string;
  is_suspended: boolean;
  resources: Resources;
}

interface Resources {
  memory_bytes: number;
  cpu_absolute: number;
  disk_bytes: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
}

// Files
export interface IFileList {
  object: string;
  data: Datum[];
}

interface Datum {
  object: Object;
  attributes: Attributes;
}

interface Attributes {
  name: string;
  mode: Mode;
  size: number;
  is_file: boolean;
  is_symlink: boolean;
  is_editable: boolean;
  mimetype: string;
  created_at: string;
  modified_at: string;
}

enum Mode {
  DrwxrXrX = "drwxr-xr-x",
  RwRR = "-rw-r--r--",
}

enum Object {
  FileObject = "file_object",
}
