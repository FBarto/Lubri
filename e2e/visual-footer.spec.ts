import { test } from '@playwright/test';

test('Capture Footer', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    const footer = page.locator('footer');
    await footer.scrollIntoViewIfNeeded();
    await footer.screenshot({ path: 'test-results/staff-access-location.png' });
});
