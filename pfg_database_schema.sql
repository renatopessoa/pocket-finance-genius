-- Habilita a extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA USERS
CREATE TABLE IF NOT EXISTS pfg_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA ACCOUNTS
CREATE TABLE IF NOT EXISTS pfg_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'wallet')),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    user_id UUID NOT NULL REFERENCES pfg_users(id) ON DELETE CASCADE,
    color VARCHAR(20),
    icon VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA CATEGORIES
CREATE TABLE IF NOT EXISTS pfg_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100),
    color VARCHAR(20),
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    budget_limit DECIMAL(15, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABELA TRANSACTIONS
CREATE TABLE IF NOT EXISTS pfg_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    category_id UUID NOT NULL REFERENCES pfg_categories(id) ON DELETE RESTRICT,
    account_id UUID NOT NULL REFERENCES pfg_accounts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES pfg_users(id) ON DELETE CASCADE,
    recurring BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABELA BUDGETS
CREATE TABLE IF NOT EXISTS pfg_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES pfg_categories(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    spent DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES pfg_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, month, year, user_id)
);

-- 6. TABELA GOALS
CREATE TABLE IF NOT EXISTS pfg_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    user_id UUID NOT NULL REFERENCES pfg_users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABELA EDUCATIONAL_CONTENT
CREATE TABLE IF NOT EXISTS pfg_educational_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'video', 'quiz')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('saving', 'investing', 'budgeting', 'debt')),
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    read_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. TABELA CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS pfg_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID NOT NULL REFERENCES pfg_users(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pfg_transactions_user_id ON pfg_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pfg_transactions_account_id ON pfg_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_pfg_transactions_category_id ON pfg_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_pfg_transactions_date ON pfg_transactions(date);
CREATE INDEX IF NOT EXISTS idx_pfg_accounts_user_id ON pfg_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_pfg_budgets_user_id ON pfg_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_pfg_goals_user_id ON pfg_goals(user_id);