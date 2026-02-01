import { test, expect } from '@playwright/test';

test('Diagnostic Pack Workflow', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER_LOG: [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', error => console.log(`BROWSER_ERROR: ${error.message}`));

    await page.goto('/login');
    await page.getByPlaceholder('admin').fill('2');
    await page.getByPlaceholder('••••••').fill('2');
    await page.getByRole('button', { name: 'INGRESAR' }).click();
    await page.waitForURL('/employee');
    console.log('Logged in successfully');

    await page.waitForTimeout(2000);

    console.log('Clicking CLIENTES...');
    const clientesBtn = page.getByRole('button', { name: 'CLIENTES' });
    await clientesBtn.click({ force: true });

    await page.waitForTimeout(3000);
    console.log('Current URL:', page.url());

    const hasSearch = await page.getByPlaceholder(/Buscar por nombre/i).isVisible();
    console.log('Is search visible?', hasSearch);

    if (!hasSearch) {
        console.log('Search not visible, taking snapshot...');
        await page.screenshot({ path: 'diagnostic_failed_nav.png' });
        return; // Stop here if navigation failed
    }

    await page.getByPlaceholder(/Buscar por nombre/i).fill('QA');
    await page.waitForTimeout(2000);

    console.log('Opening Manage Modal...');
    await page.locator('button[title="Gestionar"]').first().click();
    await page.getByText('Crear Servicio').click();

    await page.waitForTimeout(2000);
    console.log('Is Catalog visible?', await page.getByText('Catálogo de Servicios').isVisible());
    await page.screenshot({ path: 'qa_catalog_highlight.png' });

    const fullServiceBtn = page.locator('button', { hasText: 'Full Service' }).first();
    await fullServiceBtn.click();

    await page.waitForTimeout(2000);
    console.log('Is Tech Detail visible?', await page.getByText('Detalle Técnico (Libreta)').isVisible());
    await page.screenshot({ path: 'qa_modal_smart_details.png' });

    // Final check for the checkboxes
    const oilCheck = page.locator('label', { hasText: 'Filtro Aceite' }).locator('input[type="checkbox"]');
    console.log('Is Oil Filter checked?', await oilCheck.isChecked());
});
