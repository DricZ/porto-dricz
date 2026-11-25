/**
 * Typed facade over scripts/db-config.cjs (single source of truth).
 */
import dbConfig from "../../scripts/db-config.cjs";

export interface DBConfigOptions {
  forPrisma?: boolean;
  probeTimeoutMs?: number;
}

export interface DBCredentials {
  user?: string;
  password?: string;
  database?: string;
}

export type PoolConfig =
  | { connectionString: string }
  | { user: string; password: string; host: string; port: number; database: string };

type Env = NodeJS.ProcessEnv | Record<string, string | undefined>;

interface DBConfigModule {
  parseDBOptions(rawOptions?: string): Record<string, string>;
  isHostReachable(host: string, port: number, timeoutMs?: number): boolean;
  isHostPrimary(host: string, port: number, creds: DBCredentials, timeoutMs?: number): boolean;
  resolveActiveHost(
    rawHost: string,
    defaultPort?: string | number,
    probeTimeoutMs?: number,
    primaryCreds?: DBCredentials
  ): string;
  formatHosts(rawHost: string, defaultPort?: string | number): string;
  composeDatabaseUrl(envObj?: Env, options?: DBConfigOptions): string;
  getDatabasePoolConfig(envObj?: Env): PoolConfig;
}

const mod = dbConfig as DBConfigModule;

export const parseDBOptions = mod.parseDBOptions;
export const isHostReachable = mod.isHostReachable;
export const isHostPrimary = mod.isHostPrimary;
export const resolveActiveHost = mod.resolveActiveHost;
export const formatHosts = mod.formatHosts;
export const composeDatabaseUrl = mod.composeDatabaseUrl;
export const getDatabasePoolConfig = mod.getDatabasePoolConfig;
