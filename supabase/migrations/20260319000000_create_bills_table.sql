-- 9. TABELA BILLS (contas a pagar / pagamentos recorrentes)
-- Suporta RF3.2: alertas de pagamentos futuros e vencimentos

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS pfg_bills (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES pfg_users(id) ON DELETE CASCADE,
    category_id  UUID REFERENCES pfg_categories(id) ON DELETE SET NULL,
    account_id   UUID REFERENCES pfg_accounts(id) ON DELETE SET NULL,

    -- Identificação
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    amount       DECIMAL(15, 2) NOT NULL,

    -- Vencimento
    due_date     DATE NOT NULL,

    -- Recorrência
    recurring    BOOLEAN NOT NULL DEFAULT FALSE,
    -- Frequência de recorrência: monthly, weekly, yearly, null (única)
    recurrence   VARCHAR(20) CHECK (recurrence IN ('monthly', 'weekly', 'yearly')),

    -- Status do pagamento
    -- pending: aguardando pagamento
    -- paid: pago
    -- overdue: vencido sem pagamento
    -- cancelled: cancelado
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),

    paid_at      TIMESTAMP WITH TIME ZONE,

    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_pfg_bills_user_id   ON pfg_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_pfg_bills_due_date  ON pfg_bills(due_date);
CREATE INDEX IF NOT EXISTS idx_pfg_bills_status    ON pfg_bills(status);

-- Índice composto: mais comum — buscar contas pendentes de um usuário por prazo
CREATE INDEX IF NOT EXISTS idx_pfg_bills_user_status_due
    ON pfg_bills(user_id, status, due_date);
