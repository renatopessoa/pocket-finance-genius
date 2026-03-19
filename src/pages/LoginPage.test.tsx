import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn()
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    (useAuth as any).mockReturnValue({ login: vi.fn() });
    (useToast as any).mockReturnValue({ toast: vi.fn() });
  });

  it('renders login form by default', () => {
    render(<LoginPage />);
    expect(screen.getByText('Bem-vindo de volta')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Entrar/i }).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/Nome completo/i)).not.toBeInTheDocument();
  });

  it('switches to register form', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByRole('heading', { name: 'Criar conta' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument();
  });

  it('shows error toast when fetch fails (network error)', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
    const mockToast = vi.fn();
    (useToast as any).mockReturnValue({ toast: mockToast });

    const { container } = render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'password123' } });
    
    const submitBtn = container.querySelector('button[type="submit"]');
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Erro',
        variant: 'destructive',
      }));
    });
  });

  it('calls login context and shows success toast on successful login', async () => {
    const mockLogin = vi.fn();
    const mockToast = vi.fn();
    (useAuth as any).mockReturnValue({ login: mockLogin });
    (useToast as any).mockReturnValue({ toast: mockToast });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'John Doe', token: 'abc' }),
    });

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'password123' } });
    
    const submitBtn = screen.getAllByText('Entrar').find(el => el.tagName === 'BUTTON' && (el as HTMLButtonElement).type === 'submit');
    fireEvent.click(submitBtn!);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ name: 'John Doe', token: 'abc' });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Bem-vindo de volta!',
      }));
    });
  });
});
