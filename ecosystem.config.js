// SignLex Backend - PM2 Ecosystem Config
// Author: Amin Memon
//
// Usage:
//   Staging:    pm2 start ecosystem.config.js --only signlex-staging
//   Production: pm2 start ecosystem.config.js --only signlex-production

module.exports = {
  apps: [
    {
      name: "signlex-staging",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "staging",
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: "256M",
      error_file: "./logs/staging-error.log",
      out_file: "./logs/staging-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "signlex-production",
      script: "src/server.js",
      instances: "max", // cluster mode - 1 process per CPU core
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      watch: false,
      max_memory_restart: "512M",
      error_file: "./logs/prod-error.log",
      out_file: "./logs/prod-out.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
