// PM2 Ecosystem Configuration for WazAssist AI
// Use with: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name: 'wazassist-api',
      script: './backend/src/index.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      restart_delay: 4000,

      // Monitoring
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', 'logs', '.git'],

      // Advanced features
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Graceful shutdown
      shutdown_with_message: true,

      // Instance management
      instance_var: 'INSTANCE_ID',
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'nodejs',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/wazassist.git',
      path: '/var/www/wazassist',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'nodejs',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/wazassist.git',
      path: '/var/www/wazassist-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
