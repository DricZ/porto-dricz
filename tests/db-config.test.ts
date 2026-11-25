import { describe, expect, it } from "bun:test";
import {
  parseDBOptions,
  formatHosts,
  resolveActiveHost,
  composeDatabaseUrl,
  getDatabasePoolConfig,
} from "../src/lib/db-config";

describe("Database URL & Options Composition (Postgres HA & Laravel Compatibility)", () => {
  it("harus mem-parse DB_OPTIONS dengan benar (menghapus quotes, --, dan -c)", () => {
    expect(parseDBOptions("")).toEqual({});
    expect(parseDBOptions("   ")).toEqual({});
    expect(parseDBOptions('"--target_session_attrs=read-write"')).toEqual({
      target_session_attrs: "read-write",
    });
    expect(parseDBOptions("--target_session_attrs=read-write")).toEqual({
      target_session_attrs: "read-write",
    });
    expect(
      parseDBOptions('"--target_session_attrs=read-write -c statement_timeout=5000"')
    ).toEqual({
      target_session_attrs: "read-write",
      statement_timeout: "5000",
    });
    expect(
      parseDBOptions("--target_session_attrs=read-write --connect_timeout=5")
    ).toEqual({
      target_session_attrs: "read-write",
      connect_timeout: "5",
    });
  });

  it("harus memformat multi-host dengan port default", () => {
    expect(formatHosts("localhost", "5432")).toBe("localhost:5432");
    expect(formatHosts("172.16.30.4,10.9.0.2", "5432")).toBe(
      "172.16.30.4:5432,10.9.0.2:5432"
    );
    expect(formatHosts("172.16.30.4:5433,10.9.0.2", "5432")).toBe(
      "172.16.30.4:5433,10.9.0.2:5432"
    );
  });

  it("harus meresolve active host untuk Prisma dari multi-host kandidat", () => {
    expect(resolveActiveHost("localhost", "5432")).toBe("localhost:5432");
    const resolved = resolveActiveHost("172.16.30.4,10.9.0.2", "5432", 100);
    expect(["172.16.30.4:5432", "10.9.0.2:5432"]).toContain(resolved);
  });

  it("harus menyusun DATABASE_URL dari DB_* variabel yang kompatibel dengan Prisma & HA", () => {
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
    expect(url).toContain("schema=public");

    // With forPrisma: false: raw multi-host format
    const rawMultiUrl = composeDatabaseUrl(mockEnv, { forPrisma: false });
    expect(rawMultiUrl).toContain("172.16.30.4:5432,10.9.0.2:5432");
    expect(rawMultiUrl).toContain("target_session_attrs=read-write");
  });

  it("harus mendukung fallback format Laravel DB_USERNAME, DB_PASSWORD, DB_DATABASE", () => {
    const mockEnv = {
      DB_HOST: "127.0.0.1",
      DB_PORT: "5432",
      DB_USERNAME: "laravel_user",
      DB_PASSWORD: "mypassword",
      DB_DATABASE: "laravel_db",
      DB_OPTIONS: "--target_session_attrs=read-write",
    };

    const url = composeDatabaseUrl(mockEnv);
    expect(url).toBe(
      "postgresql://laravel_user:mypassword@127.0.0.1:5432/laravel_db?schema=public&target_session_attrs=read-write"
    );
  });

  it("harus memperkaya DATABASE_URL yang sudah ada dengan DB_OPTIONS jika tersedia", () => {
    const mockEnv = {
      DATABASE_URL: "postgresql://admin:pass@localhost:5432/porto_db?schema=public",
      DB_OPTIONS: '"--target_session_attrs=read-write"',
    };

    const url = composeDatabaseUrl(mockEnv);
    expect(url).toContain("schema=public");
    expect(url).toContain("target_session_attrs=read-write");
  });

  it("harus memprioritaskan DB_* di atas DATABASE_URL yang basi (stale env)", () => {
    const mockEnv = {
      DATABASE_URL: "postgresql://postgres:old@localhost:5432/old_db?schema=public",
      DB_HOST: "172.16.30.4,10.9.0.2",
      DB_PORT: "5432",
      DB_USER: "postgres",
      DB_PASS: "newpass",
      DB_NAME: "porto_aud_db",
      DB_OPTIONS: '"--target_session_attrs=read-write"',
    };

    const url = composeDatabaseUrl(mockEnv, { forPrisma: true, probeTimeoutMs: 100 });
    expect(url).not.toContain("@localhost:");
    expect(url).toContain("/porto_aud_db");
    expect(url).toContain("target_session_attrs=read-write");
  });

  it("harus mengembalikan connectionString pada getDatabasePoolConfig", () => {
    const mockEnv = {
      DB_HOST: "localhost",
      DB_PORT: "5432",
      DB_USER: "postgres",
      DB_PASS: "pass",
      DB_NAME: "porto_db",
      DB_OPTIONS: "--target_session_attrs=read-write",
    };

    const config = getDatabasePoolConfig(mockEnv);
    if ("connectionString" in config) {
      expect(config.connectionString).toBeDefined();
      expect(config.connectionString).toContain("target_session_attrs=read-write");
    } else {
      throw new Error("Expected connectionString in config");
    }
  });
});
