import { test, expect } from '@playwright/test';

test('Capture Pack Workflow Visuals', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.getByPlaceholder('admin').fill('2');
    await page.getByPlaceholder('••••••').fill('2');
    await page.getByRole('button', { name: 'INGRESAR' }).click();
    await page.waitForURL('/employee');

    // Wait for any toasts to clear
    await page.waitForTimeout(3000);

    // 2. Click CLIENTES forcefully
    const clientesBtn = page.getByRole('button', { name: 'CLIENTES' });
    await clientesBtn.click();

    // Screenshot 1: Client List
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_client_list.png' });

    // 3. Search and Manage
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill('QA');
    await page.waitForTimeout(2000);

    await page.locator('button[title="Gestionar"]').first().click();
    await page.getByText('Crear Servicio').click();

    // 4. Services Catalog - CAPTURE THIS
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_services_catalog.png' });

    // 5. Select Pack/Full Service
    const packBtn = page.locator('button', { hasText: 'Full Service' }).first();
    await expect(packBtn).toBeVisible();
    await packBtn.click();

    // 6. Modal with technical details - CAPTURE THIS
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'qa_service_modal_tech.png' });

    // 7. Verify Smart Defaults
    const oilFilter = page.locator('label', { hasText: 'Filtro Aceite' }).locator('input[type="checkbox"]');
    await expect(oilFilter).toBeChecked();
});
