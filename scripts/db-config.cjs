/**
 * Shared PostgreSQL connection config (CommonJS, single source of truth).
 *
 * Supports Laravel-style HA config:
 *   DB_HOST=172.16.30.4,10.9.0.2
 *   DB_OPTIONS="--target_session_attrs=read-write"
 *
 * node-postgres and Prisma do NOT support multi-host URLs nor honour
 * target_session_attrs, so we resolve the host ourselves:
 *   - read-write/primary  -> first host where pg_is_in_recovery() = false
 *   - otherwise           -> first TCP-reachable host
 */
const { spawnSync } = require("child_process");

const WRITABLE_ATTRS = new Set(["read-write", "primary"]);

function parseDBOptions(rawOptions) {
  const result = {};
  if (!rawOptions) return result;
  const trimmed = String(rawOptions).trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return result;

  for (const part of trimmed.split(/\s+/)) {
    let p = part.trim();
    if (p.startsWith("--")) p = p.slice(2);
    else if (p.startsWith("-c")) p = p.slice(2);
    p = p.trim();
    const eqIdx = p.indexOf("=");
    if (eqIdx > 0) result[p.slice(0, eqIdx).trim()] = p.slice(eqIdx + 1).trim();
  }
  return result;
}

function splitHosts(rawHost, defaultPort) {
  const dPort = String(defaultPort || "5432");
  return String(rawHost || "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean)
    .map((item) => {
      const [host, port] = item.split(":");
      return { host, port: parseInt(port || dPort, 10) };
    });
}

// Host/port/credentials are passed via env (never interpolated) to avoid injection.
const TCP_PROBE = `
  const net = require("net");
  const t = parseInt(process.env.PROBE_TIMEOUT, 10);
  const s = net.createConnection(parseInt(process.env.PROBE_PORT, 10), process.env.PROBE_HOST, () => { s.destroy(); process.exit(0); });
  s.setTimeout(t, () => { s.destroy(); process.exit(1); });
  s.on("error", () => process.exit(1));
`;

const PRIMARY_PROBE = `
  const { Client } = require("pg");
  const c = new Client({
    host: process.env.PROBE_HOST, port: parseInt(process.env.PROBE_PORT, 10),
    user: process.env.PROBE_USER, password: process.env.PROBE_PASS, database: process.env.PROBE_DB,
    connectionTimeoutMillis: parseInt(process.env.PROBE_TIMEOUT, 10),
  });
  c.connect()
    .then(() => c.query("SELECT pg_is_in_recovery() AS r"))
    .then((res) => process.exit(res.rows[0].r ? 2 : 0))
    .catch(() => process.exit(1));
`;

function runProbe(script, env, timeoutMs) {
  try {
    // Build args dynamically so Next.js Turbopack does not treat "-e" as a module path.
    const args = [];
    args.push("-e", script);
    const res = spawnSync(process.execPath || "node", args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env, PROBE_TIMEOUT: String(timeoutMs) },
      timeout: timeoutMs * 2 + 500,
      stdio: "ignore",
    });
    return res.status;
  } catch {
    return 1;
  }
}

function isHostReachable(host, port, timeoutMs = 600) {
  return runProbe(TCP_PROBE, { PROBE_HOST: host, PROBE_PORT: String(port) }, timeoutMs) === 0;
}

/** true = primary (writable), false = standby or unreachable. */
function isHostPrimary(host, port, creds, timeoutMs = 1500) {
  return (
    runProbe(
      PRIMARY_PROBE,
      {
        PROBE_HOST: host,
        PROBE_PORT: String(port),
        PROBE_USER: creds.user || "",
        PROBE_PASS: creds.password || "",
        PROBE_DB: creds.database || "",
      },
      timeoutMs
    ) === 0
  );
}

/**
 * Resolve multi-host DB_HOST to a single "host:port".
 * If `primaryCreds` is given, prefers the writable primary.
 */
function resolveActiveHost(rawHost, defaultPort = "5432", probeTimeoutMs, primaryCreds) {
  const hosts = splitHosts(rawHost, defaultPort);
  if (hosts.length === 0) return `localhost:${defaultPort}`;
  if (hosts.length === 1) return `${hosts[0].host}:${hosts[0].port}`;

  if (primaryCreds) {
    const primaryTimeout = probeTimeoutMs ?? 1500;
    for (const { host, port } of hosts) {
      if (isHostPrimary(host, port, primaryCreds, primaryTimeout)) return `${host}:${port}`;
    }
  }

  const tcpTimeout = probeTimeoutMs ?? 600;
  for (const { host, port } of hosts) {
    if (isHostReachable(host, port, tcpTimeout)) return `${host}:${port}`;
  }

  return `${hosts[0].host}:${hosts[0].port}`;
}

function formatHosts(rawHost, defaultPort = "5432") {
  const hosts = splitHosts(rawHost, defaultPort);
  if (hosts.length === 0) return `localhost:${defaultPort}`;
  return hosts.map(({ host, port }) => `${host}:${port}`).join(",");
}

function readCredentials(envObj) {
  return {
    user: envObj.DB_USER || envObj.DB_USERNAME || envObj.POSTGRES_USER,
    password:
      envObj.DB_PASS !== undefined
        ? envObj.DB_PASS
        : envObj.DB_PASSWORD !== undefined
          ? envObj.DB_PASSWORD
          : envObj.POSTGRES_PASSWORD,
    host: envObj.DB_HOST || envObj.POSTGRES_HOST || "localhost",
    port: envObj.DB_PORT || envObj.POSTGRES_PORT || "5432",
    database: envObj.DB_NAME || envObj.DB_DATABASE || envObj.POSTGRES_DB,
  };
}

/**
 * Compose the PostgreSQL URL.
 * Priority: DB_* vars (HA-aware) > DATABASE_URL (enriched with DB_OPTIONS).
 * DB_* wins so a stale DATABASE_URL in the process env cannot pin an old host.
 */
function composeDatabaseUrl(envObj = process.env, options = { forPrisma: true }) {
  const parsedOptions = parseDBOptions(envObj.DB_OPTIONS || "");
  const creds = readCredentials(envObj);

  if (creds.user && creds.password !== undefined && creds.database) {
    const wantsPrimary = WRITABLE_ATTRS.has(parsedOptions.target_session_attrs);
    const hostFormatted =
      options.forPrisma ?? true
        ? resolveActiveHost(
            creds.host,
            creds.port,
            options.probeTimeoutMs,
            wantsPrimary ? creds : undefined
          )
        : formatHosts(creds.host, creds.port);
    const params = new URLSearchParams({ schema: "public", ...parsedOptions });
    return `postgresql://${creds.user}:${encodeURIComponent(creds.password)}@${hostFormatted}/${creds.database}?${params.toString()}`;
  }

  const rawUrl = envObj.DATABASE_URL;
  if (rawUrl && !rawUrl.includes("${")) {
    if (Object.keys(parsedOptions).length === 0) return rawUrl;
    const [baseUrl, query = ""] = rawUrl.split("?");
    const params = new URLSearchParams(query);
    for (const [k, v] of Object.entries(parsedOptions)) params.set(k, v);
    return `${baseUrl}?${params.toString()}`;
  }

  return "";
}

function getDatabasePoolConfig(envObj = process.env) {
  const url = composeDatabaseUrl(envObj, { forPrisma: true });
  if (url) return { connectionString: url };

  const creds = readCredentials(envObj);
  const [host, portStr] = resolveActiveHost(creds.host, creds.port).split(":");
  return {
    user: creds.user || "postgres",
    password: creds.password || "",
    host,
    port: parseInt(portStr || "5432", 10),
    database: creds.database || "porto_db",
  };
}

module.exports = {
  parseDBOptions,
  isHostReachable,
  isHostPrimary,
  resolveActiveHost,
  formatHosts,
  composeDatabaseUrl,
  getDatabasePoolConfig,
};
