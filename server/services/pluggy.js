/**
 * Pluggy Open Banking — Serviço de integração.
 *
 * Usa a API REST do Pluggy (https://docs.pluggy.ai) para:
 *  - Gerar connect tokens (widget de conexão bancária)
 *  - Buscar contas e transações vinculadas a um Item (conexão bancária)
 */

import logger from '../lib/logger.js';

const PLUGGY_BASE_URL = 'https://api.pluggy.ai';

// ── Autenticação na API do Pluggy ────────────────────────────────────────────
let cachedApiKey = null;
let apiKeyExpiresAt = 0;

async function getApiKey() {
    // Reutiliza a chave se ainda válida (margem de 60s)
    if (cachedApiKey && Date.now() < apiKeyExpiresAt - 60_000) {
        return cachedApiKey;
    }

    const clientId = process.env.PLUGGY_CLIENT_ID;
    const clientSecret = process.env.PLUGGY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET são obrigatórios');
    }

    const res = await fetch(`${PLUGGY_BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!res.ok) {
        const body = await res.text();
        logger.error('Pluggy auth falhou', { status: res.status, body });
        throw new Error(`Pluggy auth falhou: ${res.status}`);
    }

    const data = await res.json();
    cachedApiKey = data.apiKey;
    // O token dura 2h; guardamos o timestamp de expiração
    apiKeyExpiresAt = Date.now() + 2 * 60 * 60 * 1000;
    return cachedApiKey;
}

async function pluggyFetch(path, options = {}) {
    const apiKey = await getApiKey();
    const res = await fetch(`${PLUGGY_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
            ...options.headers,
        },
    });
    if (!res.ok) {
        const body = await res.text();
        logger.error(`Pluggy ${options.method || 'GET'} ${path} falhou`, { status: res.status, body });
        throw new Error(`Pluggy API erro: ${res.status}`);
    }
    return res.json();
}

// ── Connect Token ────────────────────────────────────────────────────────────
export async function createConnectToken(itemId) {
    const body = itemId ? { itemId } : {};
    return pluggyFetch('/connect_token', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

// ── Items (conexões bancárias) ───────────────────────────────────────────────
export async function getItem(itemId) {
    return pluggyFetch(`/items/${itemId}`);
}

export async function deleteItem(itemId) {
    const apiKey = await getApiKey();
    const res = await fetch(`${PLUGGY_BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'X-API-KEY': apiKey },
    });
    if (!res.ok) throw new Error(`Pluggy DELETE item falhou: ${res.status}`);
}

// ── Contas ───────────────────────────────────────────────────────────────────
export async function getAccounts(itemId) {
    return pluggyFetch(`/accounts?itemId=${itemId}`);
}

export async function getAccountById(accountId) {
    return pluggyFetch(`/accounts/${accountId}`);
}

// ── Transações ───────────────────────────────────────────────────────────────
export async function getTransactions(accountId, { from, to, page = 1, pageSize = 500 } = {}) {
    const params = new URLSearchParams({ accountId, page: String(page), pageSize: String(pageSize) });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    return pluggyFetch(`/transactions?${params}`);
}
