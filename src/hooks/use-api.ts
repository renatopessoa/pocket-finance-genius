import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('pfg_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// ─── Mappers DB (snake_case) → Frontend (camelCase) ───────────────────────────

const toCategory = (row: any) => ({
    id: row.id as string,
    name: row.name as string,
    icon: (row.icon as string) || '',
    color: (row.color as string) || '#666',
    type: row.type as 'income' | 'expense',
    budgetLimit: row.budget_limit != null ? parseFloat(row.budget_limit) : undefined,
});

const toAccount = (row: any) => ({
    id: row.id as string,
    name: row.name as string,
    type: row.type as string,
    balance: parseFloat(row.balance),
    userId: row.user_id as string,
    color: (row.color as string) || '#3B82F6',
    icon: (row.icon as string) || 'Wallet',
});

const toTransaction = (row: any) => ({
    id: row.id as string,
    amount: parseFloat(row.amount),
    description: row.description as string,
    date: new Date(row.date),
    type: row.type as 'income' | 'expense',
    categoryId: row.category_id as string,
    accountId: row.account_id as string,
    userId: row.user_id as string,
    recurring: row.recurring ?? false,
    tags: (row.tags as string[]) || [],
    categoryName: row.category_name as string | undefined,
    categoryColor: row.category_color as string | undefined,
    categoryIcon: row.category_icon as string | undefined,
});

const toBudget = (row: any) => ({
    id: row.id as string,
    categoryId: row.category_id as string,
    amount: parseFloat(row.amount),
    spent: parseFloat(row.spent),
    month: row.month as number,
    year: row.year as number,
    userId: row.user_id as string,
    categoryName: row.category_name as string | undefined,
    categoryColor: row.category_color as string | undefined,
    categoryIcon: row.category_icon as string | undefined,
});

// ─── USER ─────────────────────────────────────────────────────────────────────

// Reads the authenticated user from AuthContext (localStorage session).
// Returns the same shape as before so all consumers work without changes.
export const useCurrentUser = () => {
    const { currentUser } = useAuth();
    return { data: currentUser ?? undefined, isLoading: false, isError: false };
};

// ─── ACCOUNTS ─────────────────────────────────────────────────────────────────

export const useAccounts = () =>
    useQuery({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/accounts`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Erro ao buscar contas');
            return ((await res.json()) as any[]).map(toAccount);
        },
    });

export const useCreateAccount = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_URL}/accounts`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name: data.name, type: data.type, balance: data.balance, color: data.color, icon: data.icon }),
            });
            if (!res.ok) throw new Error('Erro ao criar conta');
            return toAccount(await res.json());
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    });
};

export const useUpdateAccount = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const res = await fetch(`${API_URL}/accounts/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ name: data.name, type: data.type, balance: data.balance, color: data.color, icon: data.icon }),
            });
            if (!res.ok) throw new Error('Erro ao atualizar conta');
            return toAccount(await res.json());
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    });
};

export const useDeleteAccount = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/accounts/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Erro ao excluir conta');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    });
};

export const useTransferFunds = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: { fromAccountId: string; toAccountId: string; amount: number }) => {
            const res = await fetch(`${API_URL}/accounts/transfer`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ from_account_id: data.fromAccountId, to_account_id: data.toAccountId, amount: data.amount }),
            });
            if (!res.ok) throw new Error('Erro ao realizar transferência');
            return res.json();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
    });
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export const useCategories = () =>
    useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/categories`);
            if (!res.ok) throw new Error('Erro ao buscar categorias');
            return ((await res.json()) as any[]).map(toCategory);
        },
        staleTime: 5 * 60 * 1000,
    });

export const useCreateCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name: string; icon?: string; color: string; type: 'income' | 'expense'; budget_limit?: number }) => {
            const res = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Erro ao criar categoria');
            return toCategory(await res.json());
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    });
};

export const useDeleteCategory = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Erro ao excluir categoria');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    });
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const useTransactions = () =>
    useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/transactions`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Erro ao buscar transações');
            return ((await res.json()) as any[]).map(toTransaction);
        },
    });

export const useCreateTransaction = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: any | any[]) => {
            const fmt = (item: any) => ({
                amount: item.amount,
                description: item.description,
                date: item.date instanceof Date ? item.date.toISOString() : item.date,
                type: item.type,
                category_id: item.categoryId,
                account_id: item.accountId,
                recurring: item.recurring ?? false,
                tags: item.tags ?? [],
            });
            const payload = Array.isArray(data) ? data.map(fmt) : fmt(data);
            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Erro ao criar transação');
            const json = await res.json();
            return Array.isArray(json) ? json.map(toTransaction) : toTransaction(json);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
};

export const useUpdateTransaction = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const res = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    amount: data.amount,
                    description: data.description,
                    date: data.date instanceof Date ? data.date.toISOString() : data.date,
                    type: data.type,
                    category_id: data.categoryId,
                    account_id: data.accountId,
                    recurring: data.recurring ?? false,
                    tags: data.tags ?? [],
                }),
            });
            if (!res.ok) throw new Error('Erro ao atualizar transação');
            return toTransaction(await res.json());
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
};

export const useDeleteTransaction = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Erro ao excluir transação');
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] });
            qc.invalidateQueries({ queryKey: ['accounts'] });
        },
    });
};

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export const useBudgets = (month?: number, year?: number) =>
    useQuery({
        queryKey: ['budgets', month, year],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (month !== undefined) params.append('month', String(month));
            if (year !== undefined) params.append('year', String(year));
            const qs = params.toString();
            const res = await fetch(`${API_URL}/budgets${qs ? '?' + qs : ''}`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Erro ao buscar orçamentos');
            return ((await res.json()) as any[]).map(toBudget);
        },
    });

export const useCreateBudget = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`${API_URL}/budgets`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ category_id: data.categoryId, amount: data.amount, month: data.month, year: data.year }),
            });
            if (!res.ok) throw new Error('Erro ao criar orçamento');
            return toBudget(await res.json());
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
    });
};

export const useUpdateBudget = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: any) => {
            const res = await fetch(`${API_URL}/budgets/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ category_id: data.categoryId, amount: data.amount, month: data.month, year: data.year }),
            });
            if (!res.ok) throw new Error('Erro ao atualizar orçamento');
            return toBudget(await res.json());
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
    });
};

export const useDeleteBudget = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`${API_URL}/budgets/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Erro ao excluir orçamento');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
    });
};

/* ── EDUCATIONAL CONTENT ── */
const toEducationalContent = (row: any) => ({
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    type: row.type as string,
    category: row.category as string,
    difficulty: row.difficulty as string,
    readTime: row.read_time as number | null,
});

export const useEducationalContent = () =>
    useQuery({
        queryKey: ['educational-content'],
        queryFn: async () => {
            const res = await fetch(`${API_URL}/educational-content`);
            if (!res.ok) throw new Error('Erro ao buscar conteúdo educacional');
            return ((await res.json()) as any[]).map(toEducationalContent);
        },
        staleTime: 5 * 60 * 1000,
    });
