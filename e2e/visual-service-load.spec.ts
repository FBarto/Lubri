import { test } from '@playwright/test';

test('Capture Service Loading', async ({ page }) => {
    // 1. Login with QA user
    await page.goto('/login');
    await page.getByPlaceholder('admin').fill('qa');
    await page.getByPlaceholder('••••••').fill('password123');
    await page.getByRole('button', { name: 'INGRESAR' }).click();

    // 2. Navigate to Employee
    await page.waitForURL(/admin|employee/);
    await page.goto('/employee');
    await page.waitForTimeout(3000);

    // 3. Click CLIENTES Tab
    await page.getByRole('button', { name: /CLIENTES/i }).click();

    // 4. Search Client
    await page.waitForTimeout(2000);
    const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
    await searchInput.fill('QA');
    await page.waitForTimeout(3000); // Wait for results

    // 5. Click "Gestionar" -> "Crear Servicio"
    const manageBtn = page.locator('button[title="Gestionar"]').first();
    if (await manageBtn.isVisible()) {
        await manageBtn.click();
        await page.waitForTimeout(1000);
        await page.getByText('Crear Servicio').click();
        await page.waitForTimeout(1000);

        // 6. Services Wizard - Click Lubricentro
        const catBtn = page.getByText('Lubricentro');
        if (await catBtn.isVisible()) await catBtn.click();
        await page.waitForTimeout(1000);

        // 7. Click a Service
        const svcBtn = page.locator('button:has-text("$")').first();
        if (await svcBtn.isVisible()) await svcBtn.click();
        await page.waitForTimeout(1000);

        // 8. Service Modal - Fill
        const plateInput = page.getByPlaceholder('AAA 123');
        if (await plateInput.isVisible()) await plateInput.fill('TST 999');

        const notesInput = page.getByPlaceholder(/Especificaciones/i);
        if (await notesInput.isVisible()) await notesInput.fill('Evidencia de Service Book visualizada.');
    } else {
        console.log('Manage button not found - Search failed?');
    }

    // Final Screenshot (might be dashboard if failed, or modal if success)
    await page.screenshot({ path: 'test-results/service-load-ui.png' });
});
