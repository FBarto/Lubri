import { test, expect } from '@playwright/test';

test.describe('Booking Happy Path (New Client)', () => {
    test('should allow a new client to book a service from scratch', async ({ page }) => {

        await test.step('1. Navigate to Booking', async () => {
            await page.goto('/book');
            await expect(page.locator('text=Es mi primera vez')).toBeVisible();
        });

        await test.step('2. Select Option A (New Client)', async () => {
            await page.click('text=Es mi primera vez');
        });

        const randomPhone = '351' + Math.floor(Math.random() * 9000000 + 1000000).toString();

        await test.step('3. Enter Phone', async () => {
            await page.fill('input[type="tel"]', randomPhone);
            // Wait for name input or loading
            await page.waitForTimeout(500);
        });

        await test.step('4. Enter Name', async () => {
            await page.waitForSelector('input[placeholder="Nombre completo"]');
            await page.fill('input[placeholder="Nombre completo"]', 'Test Client Auto');
            await page.click('button:has-text("Continuar")');
        });

        await test.step('5. Arrive at Vehicle Step', async () => {
            await page.waitForSelector('text=Tu Vehículo 🚗', { timeout: 10000 });
        });

        const randomPlate = 'AA' + Math.floor(Math.random() * 900 + 100) + 'ZZ';

        await test.step('6. Enter Plate', async () => {
            await page.fill('input[placeholder*="AA123BB"]', randomPlate);
            // Wait for "Vehículo nuevo" form
            await page.waitForSelector('text=Vehículo nuevo', { timeout: 10000 });
        });

        await test.step('7. Enter Vehicle Details', async () => {
            await page.fill('input[placeholder*="Toyota"]', 'Ford');
            await page.click('text=Ford', { force: true }).catch(() => { });
            await page.fill('input[placeholder*="Cronos"]', 'Fiesta');
            await page.click('text=Fiesta', { force: true }).catch(() => { });

            await page.click('button:has-text("Siguiente")');
        });

        await test.step('8. Select Service', async () => { // Select first service
            await page.waitForSelector('.bg-white.p-4.rounded-xl', { timeout: 10000 });
            await page.click('.bg-white.p-4.rounded-xl >> nth=0');
        });

        await test.step('9. Select Date & Slot', async () => {
            // Wait for slots or "Mañana"
            try {
                // Wait for any slot button (usually contains :)
                await page.waitForSelector('button:has-text(":")', { timeout: 5000 });
                await page.click('button:has-text(":") >> nth=0');
            } catch (e) {
                console.log('No slots found immediately, checking date picker or forcing soft book');
                // If soft booking is enabled (force), we might just confirm.
            }
        });

        await test.step('10. Confirm', async () => {
            await page.click('button:has-text("Confirmar Reserva")');
            await page.waitForSelector('text=¡Todo listo!', { timeout: 15000 });
        });
    });
});
