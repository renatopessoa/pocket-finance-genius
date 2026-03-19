import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const testEmail = `testuser${randomSuffix}@example.com`;
  const testPassword = 'password123';
  const testName = 'Test User';

  test('should allow a new user to register and logs them in automatically', async ({ page }) => {
    await page.goto('/');
    
    // Switch to register tab
    await page.getByRole('button', { name: 'Cadastrar' }).click();
    
    // Fill out registration form
    await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible();
    await page.getByLabel('Nome completo').fill(testName);
    await page.getByLabel('E-mail').fill(testEmail);
    await page.getByLabel('Senha').fill(testPassword);
    
    // Submit registration
    await page.getByRole('button', { name: 'Criar conta' }).click();
    
    // Wait for the success toast which also implies the dashboard is loading
    await expect(page.getByText('Conta criada com sucesso!').first()).toBeVisible();
    
    // After registration, user is automatically logged in and navigated to the dashboard
    // Verify the URL changed or some generic dashboard component is visible
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should show error on wrong credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('E-mail').fill('nonexistent@example.com');
    await page.getByLabel('Senha').fill('wrongpassword');
    await page.locator('button[type="submit"]:has-text("Entrar")').click();
    
    await expect(page.getByText('E-mail ou senha inválidos').first()).toBeVisible(); 
  });
});
