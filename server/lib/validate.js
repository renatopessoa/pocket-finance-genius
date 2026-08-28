import { z } from 'zod';

/**
 * Middleware factory: valida req.body com um schema Zod.
 * Em caso de erro retorna 422 com a lista de campos inválidos.
 */
export function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            }));
            return res.status(422).json({ error: 'Dados inválidos', details: errors });
        }
        req.body = result.data; // usa o dado coercido/sanitizado pelo Zod
        next();
    };
}

// ── Schemas reutilizáveis ────────────────────────────────────────────────────

export const schemas = {
    // Auth
    register: z.object({
        name:     z.string().min(2, 'Nome deve ter ao menos 2 caracteres').max(255),
        email:    z.string().email('E-mail inválido').max(255),
        password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(128),
    }),

    login: z.object({
        email:    z.string().email('E-mail inválido'),
        password: z.string().min(1, 'Senha é obrigatória'),
    }),

    changePassword: z.object({
        current_password: z.string().min(1, 'Senha atual é obrigatória'),
        new_password:     z.string().min(8, 'Nova senha deve ter ao menos 8 caracteres').max(128),
    }),

    // Accounts
    account: z.object({
        name:    z.string().min(1, 'Nome é obrigatório').max(255),
        type:    z.enum(['checking', 'savings', 'credit', 'wallet'], { message: 'Tipo inválido' }),
        balance: z.coerce.number().finite().optional().default(0),
        color:   z.string().max(20).optional(),
        icon:    z.string().max(100).optional(),
    }),

    transfer: z.object({
        from_account_id: z.string().uuid('ID de conta inválido'),
        to_account_id:   z.string().uuid('ID de conta inválido'),
        amount:          z.coerce.number().positive('Valor deve ser positivo'),
    }).refine((d) => d.from_account_id !== d.to_account_id, {
        message: 'Contas de origem e destino devem ser diferentes',
    }),

    // Transactions
    transaction: z.object({
        amount:      z.coerce.number().positive('Valor deve ser positivo'),
        description: z.string().min(1, 'Descrição é obrigatória').max(500),
        date:        z.string().datetime({ message: 'Data inválida (ISO 8601)' }),
        type:        z.enum(['income', 'expense'], { message: 'Tipo deve ser income ou expense' }),
        category_id: z.string().uuid('ID de categoria inválido'),
        account_id:  z.string().uuid('ID de conta inválido'),
        recurring:   z.boolean().optional().default(false),
        tags:        z.array(z.string().max(50)).optional().default([]),
    }),

    // Budgets
    budget: z.object({
        category_id: z.string().uuid('ID de categoria inválido'),
        amount:      z.coerce.number().positive('Valor deve ser positivo'),
        month:       z.coerce.number().int().min(1).max(12),
        year:        z.coerce.number().int().min(2000).max(2100),
    }),

    // Bills
    bill: z.object({
        title:       z.string().min(1, 'Título é obrigatório').max(255),
        description: z.string().max(1000).optional(),
        amount:      z.coerce.number().positive('Valor deve ser positivo'),
        due_date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
        recurring:   z.boolean().optional().default(false),
        recurrence:  z.enum(['monthly', 'weekly', 'yearly']).optional().nullable(),
        category_id: z.string().uuid().optional().nullable(),
        account_id:  z.string().uuid().optional().nullable(),
    }).refine(
        (d) => !d.recurring || ['monthly', 'weekly', 'yearly'].includes(d.recurrence),
        { message: 'recurrence é obrigatório quando recurring=true', path: ['recurrence'] }
    ),
};
