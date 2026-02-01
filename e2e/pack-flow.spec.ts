import { test, expect } from '@playwright/test';

test('Verify Smart Pack Selection and Service Details', async ({ page }) => {
    // 1. Login as Employee
    await page.goto('/login');
    await page.getByPlaceholder('admin').fill('2');
    await page.getByPlaceholder('••••••').fill('2');
    await page.getByRole('button', { name: 'INGRESAR' }).click();
    await page.waitForURL('/employee');

    // 2. Click CLIENTES and wait for navigation
    // We look for the button in the sidebar/nav
    const clientesTab = page.locator('button:has-text("CLIENTES")');
    await clientesTab.click();

    // Wait for the client list to appear
    await expect(page.getByPlaceholder(/Buscar por nombre/i)).toBeVisible({ timeout: 10000 });

    // 3. Search "QA"
    await page.getByPlaceholder(/Buscar por nombre/i).fill('QA');
    await page.waitForTimeout(2000); // Debounce

    // 4. Manage Client
    const manageButton = page.locator('button[title="Gestionar"]').first();
    await manageButton.click();

    // 5. Create Service
    await page.getByText('Crear Servicio').click();

    // 6. Wait for Services Catalog
    await expect(page.getByText('Catálogo de Servicios')).toBeVisible();

    // 7. Find "Full Service" or "Pack"
    // Since we added "Recomendado" badge, we can look for that too
    const recommendedPack = page.locator('button', { hasText: 'Full Service' }).first();
    await expect(recommendedPack).toBeVisible();

    // Verify it has the "Recomendado" badge text
    await expect(recommendedPack.getByText('Recomendado')).toBeVisible();

    // Click it
    await recommendedPack.click();

    // 8. Verify Modal Opens with "Smart Defaults"
    await expect(page.getByText('Detalle Técnico (Libreta)')).toBeVisible();

    // Check pre-selected filters
    const oilFilterField = page.locator('label', { hasText: 'Filtro Aceite' });
    await expect(oilFilterField.locator('input[type="checkbox"]')).toBeChecked();

    const airFilterField = page.locator('label', { hasText: 'Filtro Aire' });
    await expect(airFilterField.locator('input[type="checkbox"]')).toBeChecked();

    // 9. Confirm
    const plateInput = page.getByPlaceholder('AAA 123');
    if (await plateInput.isVisible()) {
        await plateInput.fill('QA-PACK-TST');
    }

    await page.getByRole('button', { name: 'Confirmar Misión' }).click();

    // 10. Verify closure
    await expect(page.getByText('Detalle Técnico (Libreta)')).not.toBeVisible();
});
