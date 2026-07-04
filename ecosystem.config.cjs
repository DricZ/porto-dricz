require("dotenv").config();

// Construct DATABASE_URL from .env variables
const DB_USER = encodeURIComponent(process.env.DB_USER || "postgres");
const DB_PASS = encodeURIComponent(process.env.DB_PASS || "");
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "5432";
const DB_NAME = process.env.DB_NAME || "postgres";

const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;


module.exports = {
  apps: [
    {
      name: "porto-dricz",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1, // Ubah ke 'max' jika ingin menggunakan mode cluster sesuai jumlah core CPU
      exec_mode: "fork", // Ubah ke 'cluster' jika instances > 1
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        ...process.env,
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
        DATABASE_URL,
      },
    },
  ],
};
