import { describe, expect, it } from "bun:test";
const {
  parseDBOptions,
  formatHosts,
  resolveActiveHost,
  composeDatabaseUrl,
  getDatabasePoolConfig,
} = require("../scripts/db-config.cjs");

describe("Database URL & Options Composition (CommonJS helper)", () => {
  it("harus mem-parse DB_OPTIONS dengan benar", () => {
    expect(parseDBOptions('"--target_session_attrs=read-write"')).toEqual({
      target_session_attrs: "read-write",
    });
    expect(
      parseDBOptions('"--target_session_attrs=read-write -c statement_timeout=5000"')
    ).toEqual({
      target_session_attrs: "read-write",
      statement_timeout: "5000",
    });
  });

  it("harus menyusun DATABASE_URL dari multi-host dan DB_OPTIONS", () => {
    const mockEnv = {
      DB_HOST: "172.16.30.4,10.9.0.2",
      DB_PORT: "5432",
      DB_USER: "postgres_user",
      DB_PASS: "secret#password",
      DB_NAME: "porto_production",
      DB_OPTIONS: '"--target_session_attrs=read-write"',
    };

    const url = composeDatabaseUrl(mockEnv, { forPrisma: true, probeTimeoutMs: 100 });
    expect(url).toContain("postgresql://postgres_user:secret%23password@");
    expect(url).toContain("/porto_production");
    expect(url).toContain("target_session_attrs=read-write");
  });
});

