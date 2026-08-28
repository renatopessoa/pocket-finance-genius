/**
 * Logger estruturado leve — sem dependências externas.
 * Emite JSON em produção (fácil de ingerir por qualquer stack de log)
 * e texto colorido formatado em desenvolvimento.
 */

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test';

const LEVEL_MAP = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL = LEVEL_MAP[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVEL_MAP.info;

// Cores ANSI para dev
const C = {
    reset: '\x1b[0m',
    gray:  '\x1b[90m',
    cyan:  '\x1b[36m',
    yellow:'\x1b[33m',
    red:   '\x1b[31m',
    bold:  '\x1b[1m',
};

function timestamp() {
    return new Date().toISOString();
}

function formatDev(level, msg, meta) {
    const colors = { debug: C.gray, info: C.cyan, warn: C.yellow, error: C.red };
    const c = colors[level] || C.reset;
    const ts = `${C.gray}${timestamp()}${C.reset}`;
    const lv = `${c}${C.bold}[${level.toUpperCase()}]${C.reset}`;
    const metaStr = meta && Object.keys(meta).length
        ? ` ${C.gray}${JSON.stringify(meta)}${C.reset}`
        : '';
    return `${ts} ${lv} ${msg}${metaStr}`;
}

function formatProd(level, msg, meta) {
    return JSON.stringify({ ts: timestamp(), level, msg, ...meta });
}

function write(level, msg, meta = {}) {
    if (IS_TEST) return; // silencia durante testes unitários
    if (LEVEL_MAP[level] < MIN_LEVEL) return;
    const line = IS_PROD ? formatProd(level, msg, meta) : formatDev(level, msg, meta);
    if (level === 'error') {
        process.stderr.write(line + '\n');
    } else {
        process.stdout.write(line + '\n');
    }
}

const logger = {
    debug: (msg, meta)  => write('debug', msg, meta),
    info:  (msg, meta)  => write('info',  msg, meta),
    warn:  (msg, meta)  => write('warn',  msg, meta),
    error: (msg, meta)  => {
        // Aceita tanto logger.error('msg', err) quanto logger.error('msg', { key: val })
        if (meta instanceof Error) {
            write('error', msg, { err: meta.message, stack: meta.stack });
        } else {
            write('error', msg, meta);
        }
    },
};

export default logger;
