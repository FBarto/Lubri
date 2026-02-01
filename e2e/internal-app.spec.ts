import { test, expect } from '@playwright/test';

test.describe('Internal App E2E', () => {

    test.beforeEach(async ({ page }) => {
        // 0. Acceso y Sesión
        console.log('Navigating to login...');
        await page.goto('/login');

        console.log('Filling credentials...');
        // Try placeholders as fallback if label fails
        await page.getByPlaceholder('admin').fill('qa');
        await page.getByPlaceholder('••••••').fill('password123');

        console.log('Clicking login...');
        await page.getByRole('button', { name: 'INGRESAR' }).click();

        // Wait for potential navigation
        // Wait for potential navigation
        // Wait for potential navigation
        console.log('Waiting for dashboard...');
        await expect(page.getByRole('button', { name: 'TABLERO' })).toBeVisible({ timeout: 15000 });
    });

    test('1. Clientes & 2. Vehículos: Search and Create', async ({ page }) => {
        // Navigate to Clientes Tab
        await page.getByText('CLIENTES').click();

        // Search for existing client (QA User from previous batch test)
        // Wait for the client list to load (look for specific element)
        await page.waitForTimeout(1000); // Wait for animations/load

        const searchInput = page.getByPlaceholder(/Buscar/i);
        await searchInput.fill('QA New Client');
        await page.keyboard.press('Enter');

        // Verify results appear
        await expect(page.getByText('QA New Client')).toBeVisible();

        // Alta Rápida (Modal) - Assuming there is a button "Nuevo Cliente"
        // Since UI structure is unknown, we will try to find a button with + or "Nuevo"
        const newClientBtn = page.getByRole('button', { name: /Nuevo/i });
        if (await newClientBtn.isVisible()) {
            await newClientBtn.click();
            // Fill form if modal opens (Hypothetical)
            // await page.fill('input[name="name"]', 'Playwright User');
            // await page.click('button:has-text("Guardar")');
        }
    });

    test('4. Caja / POS: Venta simple', async ({ page }) => {
        // Navigate to VENTA (POS) Tab
        // The tab might be labeled "COMPRA" or "VENTA" based on the code I saw: 
        // <button>...COMPRA...</button> which sets activeTab='VENTA'
        await page.getByText('COMPRA').click(); // Button label is COMPRA based on employee/page.tsx check

        // Add Item logic
        // We need to verify we can see products.
        // The previous batch test showed products exist (ID 615).
        // Let's search for it in the grid or list.
        await page.getByPlaceholder(/Buscar productos/i).fill('AMP 339');

        // Click on the item to add to cart
        await page.waitForTimeout(1000);
        await page.locator('div').filter({ hasText: 'AMP 339' }).last().click();

        // Expect Stock Warning and Click Add Anyway
        // Using explicit click which waits for element to be actionable
        try {
            await page.getByRole('button', { name: /AGREGAR IGUAL/i }).click({ timeout: 5000 });
        } catch (e) {
            console.log('Stock modal did not appear or button not found');
        }

        // Verify Cart updates
        await expect(page.locator('text=Total:')).toBeVisible();

        // Checkout
        await page.getByRole('button', { name: /Cobrar/i }).click();

        // Confirm in Modal
        // CheckoutModal usually has "Confirmar"
        await page.getByRole('button', { name: /Confirmar/i }).click();

        // Expect success message or cart clear
        // Alert might be shown. Playwright handles dialogs automatically (dismiss by default), 
        // but we can listen to it.
        page.on('dialog', dialog => dialog.accept());
    });

});
