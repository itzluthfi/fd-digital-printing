import { test as setup, expect } from '@playwright/test';
import { AUTH_FILES, ensureResultsDirs, type AuthRole } from './helpers';

const CREDENTIALS: Record<AuthRole, { email: string; password: string; expectedUrl: RegExp }> = {
	owner: {
		email: 'owner@fd.local',
		password: process.env.DEMO_STAFF_PASSWORD || 'admin123',
		expectedUrl: /\/dashboard/
	},
	admin: {
		email: 'admin@fd.local',
		password: process.env.DEMO_STAFF_PASSWORD || 'admin123',
		expectedUrl: /\/dashboard/
	},
	operator: {
		email: 'operator@fd.local',
		password: process.env.DEMO_STAFF_PASSWORD || 'admin123',
		expectedUrl: /\/order/
	}
};

for (const role of Object.keys(CREDENTIALS) as AuthRole[]) {
	setup(`authenticate as ${role}`, async ({ page }) => {
		ensureResultsDirs();
		const cred = CREDENTIALS[role];

		await page.goto('/sign-in');
		await page.locator('#email').fill(cred.email);
		await page.locator('#password').fill(cred.password);
		await page.locator('button[type="submit"]').click();

		await expect(page).toHaveURL(cred.expectedUrl, { timeout: 15_000 });
		await page.context().storageState({ path: AUTH_FILES[role] });
	});
}
