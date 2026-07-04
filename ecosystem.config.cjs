require("dotenv").config();

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
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
    },
  ],
};
