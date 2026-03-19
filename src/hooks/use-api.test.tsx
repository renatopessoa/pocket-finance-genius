import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useAccounts, useCategories, useTransactions } from './use-api';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 'user123', name: 'Test User' }
  })
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('use-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    global.fetch = vi.fn();
  });

  it('useAccounts fetches and transforms data correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: '1', name: 'Nubank', type: 'checking', balance: '100.50', user_id: 'user123', color: '#000', icon: 'Wallet' }
      ]
    });

    const { result } = renderHook(() => useAccounts('user123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { id: '1', name: 'Nubank', type: 'checking', balance: 100.50, userId: 'user123', color: '#000', icon: 'Wallet' }
    ]);
  });

  it('useCategories fetches data correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 'c1', name: 'Food', icon: 'Utensils', color: '#f00', type: 'expense', budget_limit: '500.00' }
      ]
    });

    const { result } = renderHook(() => useCategories(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      { id: 'c1', name: 'Food', icon: 'Utensils', color: '#f00', type: 'expense', budgetLimit: 500.00 }
    ]);
  });

  it('useTransactions transforms dates and numbers correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { 
          id: 't1', amount: '25.50', description: 'Lunch', 
          date: '2026-03-19T10:00:00.000Z', type: 'expense', 
          category_id: 'c1', account_id: 'a1', user_id: 'user123', recurring: false, tags: ['meal'] 
        }
      ]
    });

    const { result } = renderHook(() => useTransactions('user123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].amount).toBe(25.50);
    expect(result.current.data![0].date).toBeInstanceOf(Date);
    expect(result.current.data![0].tags).toEqual(['meal']);
  });
});
