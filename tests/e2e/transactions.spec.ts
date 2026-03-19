import { test, expect } from '@playwright/test';

test.describe('Transactions Flow', () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testEmail = `txuser${randomSuffix}@example.com`;

  test.beforeEach(async ({ page }) => {
    // Register a user to start fresh
    await page.goto('/');
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    await page.getByLabel('Nome completo').fill('Tx User');
    await page.getByLabel('E-mail').fill(testEmail);
    await page.getByLabel('Senha').fill('password123');
    await page.getByRole('button', { name: 'Criar conta' }).click();
    await expect(page.getByText('Conta criada com sucesso!').first()).toBeVisible();
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should open form, validate, and require account to create a transaction', async ({ page }) => {
    // Navigate to Transações page where the Nova Transação button exists
    await page.goto('/transacoes');

    // Wait for the button
    await page.getByRole('button', { name: /Nova Transação/i }).waitFor();
    await page.getByRole('button', { name: /Nova Transação/i }).click();

    // Modal should be open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill valid amount and description
    await page.getByLabel('Valor').fill('150.00');
    await page.getByLabel('Descrição').fill('Grocery');

    // Submit without account
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(page.getByText('Conta obrigatória').first()).toBeVisible();

    // Inline create account
    await page.getByRole('button', { name: /Nova conta/i }).click();
    await page.getByRole('textbox', { name: /Nome da conta/i }).fill('Bank Account');
    
    // The "Salvar" button might be inside the small inline form.
    await page.getByRole('button', { name: 'Salvar' }).first().click();

    // Wait for the inline form to close or account to be selected
    // Usually, the account is added successfully and selected.
    await expect(page.getByRole('textbox', { name: /Nome da conta/i })).not.toBeVisible();
    
    // Because it automatically selects the new account, we can now submit!
    // Since category is optional or handled gracefully, let's try. 
    // Wait, the category form might also be required. Let's see if there's "Categoria obrigatória"
    await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    
    // Check if it created successfully or asked for a category
    // If it asks for category, "Categoria obrigatória" could be visible. Let's assume there's a default or we just create it just in case.
    
    // Using an assertion wrapper to check if it succeeded
    const isSuccess = await page.getByText(/Transação.*(criada|adicionada)!?/i).first().isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!isSuccess) {
      // Must mean category is required!
      await page.getByRole('button', { name: /Nova categoria/i }).click();
      await page.getByRole('textbox', { name: /Nome da categoria/i }).fill('Alimentação');
      await page.getByRole('button', { name: 'Salvar' }).first().click();
      await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
    }
    
    await expect(page.getByText(/Transação.*(criada|adicionada)!?/i).first()).toBeVisible();
  });
});
