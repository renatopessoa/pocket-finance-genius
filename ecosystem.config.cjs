// ecosystem.config.cjs — Configuração do PM2 para produção
// Uso:
//   pm2 start ecosystem.config.cjs
//   pm2 save && pm2 startup   (configura reinício automático com o SO)

module.exports = {
    apps: [
        {
            name: 'pfg-server',
            script: './server.js',

            // ── Ambiente ────────────────────────────────────────────────────
            node_args: '--env-file=.env',   // Node 20.6+ carrega .env nativamente
            env: {
                NODE_ENV: 'production',
            },

            // ── Clustering (opcional — comente se quiser single instance) ──
            // instances: 'max',   // 1 processo por vCPU
            // exec_mode: 'cluster',

            // ── Reinício automático ──────────────────────────────────────────
            watch: false,              // nunca fazer watch em produção
            max_memory_restart: '512M',

            // ── Logs ────────────────────────────────────────────────────────
            out_file:   './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
            merge_logs: true,

            // ── Reinicialização inteligente ──────────────────────────────────
            restart_delay: 3000,        // aguarda 3 s antes de reiniciar
            max_restarts: 10,           // após 10 falhas consecutivas, para
            min_uptime: '10s',          // considera estável após 10 s
            exp_backoff_restart_delay: 100,
        },
    ],
};
