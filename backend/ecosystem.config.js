// PM2 ecosystem config — used on EC2 to manage the backend process
module.exports = {
  apps: [
    {
      name: "tnp-backend",
      script: "src/server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "/home/ec2-user/logs/tnp-backend-error.log",
      out_file: "/home/ec2-user/logs/tnp-backend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
