import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionForm } from './TransactionForm';
import { Dialog } from '@/components/ui/dialog';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useToast } from '@/components/ui/use-toast';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('@/hooks/use-api', () => ({
  useCurrentUser: () => ({ data: { id: 'u1' } }),
  useCategories: () => ({ 
    data: [{ id: 'c1', name: 'Food', type: 'expense', color: '#f00' }] 
  }),
  useAccounts: () => ({ 
    data: [{ id: 'a1', name: 'Nubank', type: 'checking', color: '#820ad1' }] 
  }),
  useCreateCategory: () => ({ mutate: vi.fn((data, opts) => opts.onSuccess({ id: 'c2', name: data.name })) }),
  useCreateAccount: () => ({ mutate: vi.fn((data, opts) => opts.onSuccess({ id: 'a2', name: data.name })) })
}));

describe('TransactionForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: vi.fn() });
  });

  const renderForm = () => render(
    <Dialog open={true}>
      <TransactionForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    </Dialog>
  );

  it('renders correctly and validates empty submission', async () => {
    const mockToast = vi.fn();
    (useToast as any).mockReturnValue({ toast: mockToast });

    renderForm();

    // Default type is 'expense' (Despesa)
    expect(screen.getByText('Nova Transação')).toBeInTheDocument();
    
    // Fill required simple inputs
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Descrição'), { target: { value: 'Test' } });
    
    // Submit without account or category
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Conta obrigatória'
      }));
    });
  });

  it('allows inline account creation', async () => {
    renderForm();
    const user = userEvent.setup();
    
    // Click 'Nova conta' button
    const newAccountBtn = screen.getByRole('button', { name: /Nova conta/i });
    await user.click(newAccountBtn);
    
    // Mini form should appear
    expect(screen.getByText('Nova conta', { selector: 'p' })).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText('Nome');
    await user.type(nameInput, 'Inter');
    
    // Save new account
    const saveBtn = screen.getByRole('button', { name: 'Salvar' });
    await user.click(saveBtn);
    
    // Form should close after success (it calls onSuccess in mock)
    await waitFor(() => {
      expect(screen.queryByText('Nova conta', { selector: 'p' })).not.toBeInTheDocument();
    });
  });

  it('allows inline category creation', async () => {
    renderForm();
    const user = userEvent.setup();
    
    // Click 'Nova categoria' button
    const newCatBtn = screen.getByRole('button', { name: /Nova categoria/i });
    await user.click(newCatBtn);
    
    // Mini form should appear
    expect(screen.getByText(/Nova categoria — Despesa/i)).toBeInTheDocument();
    
    const nameInput = screen.getAllByLabelText('Nome')[1] || screen.getByLabelText('Nome');
    await user.type(nameInput, 'Lazer');
    
    // Save new category
    const saveBtn = screen.getByRole('button', { name: 'Salvar' });
    await user.click(saveBtn);
    
    // Form should close
    await waitFor(() => {
      expect(screen.queryByText(/Nova categoria — Despesa/i)).not.toBeInTheDocument();
    });
  });
});
