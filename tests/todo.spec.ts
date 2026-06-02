import { test, expect } from '@playwright/test';

test('add a todo item', async ({ page }) => {
  await page.goto('/todomvc');

  await page.getByPlaceholder('What needs to be done?').fill('Attend Nordic Conference');
  await page.getByPlaceholder('What needs to be done?').press('Enter');

  await expect(page.getByTestId('todo-item')).toHaveText(['Attend Nordic Conference']);
});
