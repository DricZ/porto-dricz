const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Read .env only for PORT. DB_* / DATABASE_URL are deliberately NOT injected
// into the PM2 env: PM2 caches env across `pm2 restart`, which would pin a stale
// DB host. Next.js loads .env at runtime and src/lib/db-config resolves the
// active primary (DB_HOST multi-host + DB_OPTIONS) on every process start.
const envFile = path.join(__dirname, ".env");
const fileEnv = fs.existsSync(envFile) ? dotenv.parse(fs.readFileSync(envFile)) : {};

module.exports = {
  apps: [
    {
      name: "porto-dricz",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1, // Ubah ke 'max' jika ingin menggunakan mode cluster sesuai jumlah core CPU
      exec_mode: "fork", // Ubah ke 'cluster' jika instances > 1
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: fileEnv.PORT || process.env.PORT || 3000,
      },
    },
  ],
};
