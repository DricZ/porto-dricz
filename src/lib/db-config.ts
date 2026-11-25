declare const __non_webpack_require__: ((id: string) => any) | undefined;

export interface DBConfigOptions {
  forPrisma?: boolean;
  probeTimeoutMs?: number;
}

/**
 * Parses raw DB_OPTIONS (e.g. from Laravel-style DB_OPTIONS="--target_session_attrs=read-write -c statement_timeout=5000")
 * into key-value query parameters.
 */
export function parseDBOptions(rawOptions?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!rawOptions) return result;
  const trimmed = rawOptions.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return result;

  const parts = trimmed.split(/\s+/);
  for (const part of parts) {
    let p = part.trim();
    if (p.startsWith("--")) p = p.slice(2);
    else if (p.startsWith("-c")) p = p.slice(2);
    p = p.trim();
    if (!p) continue;
    const eqIdx = p.indexOf("=");
    if (eqIdx !== -1) {
      const key = p.slice(0, eqIdx).trim();
      const value = p.slice(eqIdx + 1).trim();
      if (key) {
        result[key] = value;
      }
    }
  }
  return result;
}

/**
 * Probes TCP connectivity to host:port using a quick socket probe.
 */
export function isHostReachable(host: string, port: number, timeoutMs = 600): boolean {
  try {
    const probeScript = `
      const net = require("net");
      const s = net.createConnection(${port}, "${host}", () => { s.destroy(); process.exit(0); });
      s.setTimeout(${timeoutMs}, () => { s.destroy(); process.exit(1); });
      s.on("error", () => process.exit(1));
    `;
    // Use dynamic require to prevent Turbopack from tracing CLI arguments as bundled modules
    const req = typeof __non_webpack_require__ !== "undefined" ? __non_webpack_require__ : require;
    const cp = req("child_process");
    const res = cp.spawnSync(process.execPath || "node", ["-e", probeScript], {
      timeout: timeoutMs + 400,
      stdio: "ignore",
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

/**
 * Resolves the active database host for Prisma and single-host clients.
 * Because Prisma and Node pg do not natively support multi-host comma-separated connection URLs,
 * multi-host strings (e.g. "172.16.30.4,10.9.0.2") are resolved to the first reachable host.
 */
export function resolveActiveHost(
  rawHost: string,
  defaultPort: string | number = "5432",
  probeTimeoutMs = 600
): string {
  const dPort = String(defaultPort);
  const hosts = (rawHost || "").split(",").map((h) => h.trim()).filter(Boolean);
  if (hosts.length === 0) return `localhost:${dPort}`;
  if (hosts.length === 1) {
    const [h, p] = hosts[0].split(":");
    return `${h}:${p || dPort}`;
  }

  // Multi-host: probe candidate hosts in order to select reachable host
  for (const item of hosts) {
    const [h, p] = item.split(":");
    const port = parseInt(p || dPort, 10);
    if (isHostReachable(h, port, probeTimeoutMs)) {
      return `${h}:${port}`;
    }
  }

  // Fallback to first host if unreachable
  const [firstH, firstP] = hosts[0].split(":");
  return `${firstH}:${firstP || dPort}`;
}

/**
 * Formats hosts to support standard PostgreSQL multi-host connection string.
 */
export function formatHosts(rawHost: string, defaultPort: string | number = "5432"): string {
  const dPort = String(defaultPort);
  const hosts = (rawHost || "").split(",").map((h) => h.trim()).filter(Boolean);
  if (hosts.length === 0) return `localhost:${dPort}`;
  return hosts.map((h) => (h.includes(":") ? h : `${h}:${dPort}`)).join(",");
}

/**
 * Composes the PostgreSQL connection URL with support for:
 * - Direct DATABASE_URL (enriched with DB_OPTIONS if provided)
 * - Laravel-style DB_HOST (single or comma-separated multi-host), DB_PORT, DB_OPTIONS
 * - Fallbacks: DB_USERNAME (fallback for DB_USER), DB_PASSWORD (fallback for DB_PASS), DB_DATABASE (fallback for DB_NAME)
 * - Legacy POSTGRES_* environment variables
 */
export function composeDatabaseUrl(
  envObj: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
  options: DBConfigOptions = { forPrisma: true }
): string {
  const rawUrl = envObj.DATABASE_URL;
  const rawOptions = envObj.DB_OPTIONS || "";
  const parsedOptions = parseDBOptions(rawOptions);

  if (rawUrl && !rawUrl.includes("${")) {
    if (Object.keys(parsedOptions).length === 0) {
      return rawUrl;
    }
    const [baseUrl, query = ""] = rawUrl.split("?");
    const params = new URLSearchParams(query);
    for (const [k, v] of Object.entries(parsedOptions)) {
      params.set(k, v);
    }
    return `${baseUrl}?${params.toString()}`;
  }

  const user = envObj.DB_USER || envObj.DB_USERNAME || envObj.POSTGRES_USER;
  const pass = envObj.DB_PASS ?? envObj.DB_PASSWORD ?? envObj.POSTGRES_PASSWORD;
  const host = envObj.DB_HOST || envObj.POSTGRES_HOST || "localhost";
  const port = envObj.DB_PORT || envObj.POSTGRES_PORT || "5432";
  const db = envObj.DB_NAME || envObj.DB_DATABASE || envObj.POSTGRES_DB;

  if (user && pass !== undefined && db) {
    const encodedPass = encodeURIComponent(pass);
    const hostFormatted = (options.forPrisma ?? true)
      ? resolveActiveHost(host, port, options.probeTimeoutMs)
      : formatHosts(host, port);
    const params = new URLSearchParams({ schema: "public", ...parsedOptions });
    return `postgresql://${user}:${encodedPass}@${hostFormatted}/${db}?${params.toString()}`;
  }

  return "";
}

/**
 * Returns connection configuration for pg.Pool with active host resolution.
 */
export function getDatabasePoolConfig(
  envObj: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env
): { connectionString: string } | { user: string; password: string; host: string; port: number; database: string } {
  const url = composeDatabaseUrl(envObj, { forPrisma: true });
  if (url) {
    return { connectionString: url };
  }

  const activeHostWithPort = resolveActiveHost(
    envObj.DB_HOST || envObj.POSTGRES_HOST || "localhost",
    envObj.DB_PORT || envObj.POSTGRES_PORT || "5432"
  );
  const [host, portStr] = activeHostWithPort.split(":");
  return {
    user: envObj.DB_USER || envObj.DB_USERNAME || envObj.POSTGRES_USER || "postgres",
    password: envObj.DB_PASS ?? envObj.DB_PASSWORD ?? envObj.POSTGRES_PASSWORD ?? "",
    host,
    port: parseInt(portStr || "5432", 10),
    database: envObj.DB_NAME || envObj.DB_DATABASE || envObj.POSTGRES_DB || "porto_db",
  };
}
