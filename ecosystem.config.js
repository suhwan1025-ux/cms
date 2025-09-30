module.exports = {
  apps: [{
    name: 'contract-management-system',
    script: 'server.prod.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // 로그 로테이션 설정
    log_rotate_interval: '1d',
    log_rotate_max_size: '10M',
    log_rotate_count: 10
  }]
}; 