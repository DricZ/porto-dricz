const { spawnSync } = require("child_process");

function parseDBOptions(rawOptions) {
  const result = {};
  if (!rawOptions) return result;
  const trimmed = String(rawOptions).trim().replace(/^["']|["']$/g, "");
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

function isHostReachable(host, port, timeoutMs = 600) {
  try {
    const probeScript = `
      const net = require("net");
      const s = net.createConnection(${port}, "${host}", () => { s.destroy(); process.exit(0); });
      s.setTimeout(${timeoutMs}, () => { s.destroy(); process.exit(1); });
      s.on("error", () => process.exit(1));
    `;
    const res = spawnSync(process.execPath || "node", ["-e", probeScript], {
      timeout: timeoutMs + 400,
      stdio: "ignore",
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

function resolveActiveHost(rawHost, defaultPort = "5432", probeTimeoutMs = 600) {
  const dPort = String(defaultPort);
  const hosts = String(rawHost || "").split(",").map((h) => h.trim()).filter(Boolean);
  if (hosts.length === 0) return `localhost:${dPort}`;
  if (hosts.length === 1) {
    const [h, p] = hosts[0].split(":");
    return `${h}:${p || dPort}`;
  }

  for (const item of hosts) {
    const [h, p] = item.split(":");
    const port = parseInt(p || dPort, 10);
    if (isHostReachable(h, port, probeTimeoutMs)) {
      return `${h}:${port}`;
    }
  }

  const [firstH, firstP] = hosts[0].split(":");
  return `${firstH}:${firstP || dPort}`;
}

function formatHosts(rawHost, defaultPort = "5432") {
  const dPort = String(defaultPort);
  const hosts = String(rawHost || "").split(",").map((h) => h.trim()).filter(Boolean);
  if (hosts.length === 0) return `localhost:${dPort}`;
  return hosts.map((h) => (h.includes(":") ? h : `${h}:${dPort}`)).join(",");
}

function composeDatabaseUrl(envObj = process.env, options = { forPrisma: true }) {
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
  const pass = envObj.DB_PASS !== undefined ? envObj.DB_PASS : (envObj.DB_PASSWORD !== undefined ? envObj.DB_PASSWORD : envObj.POSTGRES_PASSWORD);
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

function getDatabasePoolConfig(envObj = process.env) {
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
    password: envObj.DB_PASS !== undefined ? envObj.DB_PASS : (envObj.DB_PASSWORD !== undefined ? envObj.DB_PASSWORD : (envObj.POSTGRES_PASSWORD || "")),
    host,
    port: parseInt(portStr || "5432", 10),
    database: envObj.DB_NAME || envObj.DB_DATABASE || envObj.POSTGRES_DB || "porto_db",
  };
}

module.exports = {
  parseDBOptions,
  isHostReachable,
  resolveActiveHost,
  formatHosts,
  composeDatabaseUrl,
  getDatabasePoolConfig,
};

