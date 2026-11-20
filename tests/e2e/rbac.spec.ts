import { test, expect } from '@playwright/test';
import { AUTH_FILES, attachErrorGuards } from './helpers';

test.describe('RBAC Authorization & Negative Authentication', () => {
	test('negative login: password salah dan validasi input kosong ditolak di /sign-in', async ({
		browser
	}) => {
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		const guards = attachErrorGuards(page);

		try {
			await page.goto('/sign-in');

			// 1. Submit kosong
			await page.locator('button[type="submit"]').click();
			await expect(page.getByText(/Silakan isi email terlebih dahulu/i)).toBeVisible();
			await expect(page).toHaveURL(/\/sign-in/);

			// 2. Kredensial salah
			await page.locator('#email').fill('owner@fd.local');
			await page.locator('#password').fill('password-salah-123');
			await page.locator('button[type="submit"]').click();

			await expect(page.getByText(/Email atau password salah/i)).toBeVisible();
			await expect(page).toHaveURL(/\/sign-in/);

			guards.assertNoErrors();
		} finally {
			await ctx.close();
		}
	});

	test('proteksi guest: akses rute internal tanpa login wajib redirect ke /sign-in', async ({
		browser
	}) => {
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		const guards = attachErrorGuards(page);

		try {
			const protectedRoutes = ['/dashboard', '/kasir', '/order', '/harga', '/pengaturan', '/pengguna'];
			for (const route of protectedRoutes) {
				await page.goto(route);
				await expect(page, `Guest mengakses ${route} harus diarahkan ke /sign-in`).toHaveURL(
					/\/sign-in/
				);
			}
			guards.assertNoErrors();
		} finally {
			await ctx.close();
		}
	});

	test('role operator: diizinkan di /order & /harga, ditolak di rute keuangan & pengaturan', async ({
		browser
	}) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.operator });
		const page = await ctx.newPage();
		const guards = attachErrorGuards(page);

		try {
			// Diizinkan
			await page.goto('/order');
			await expect(page).toHaveURL(/\/order/);
			await expect(page.locator('h1')).toContainText('Antrean Order');

			await page.goto('/harga');
			await expect(page).toHaveURL(/\/harga/);

			// Ditolak -> redirect ke /order
			const forbiddenForOperator = [
				'/dashboard',
				'/kasir',
				'/laporan',
				'/piutang',
				'/pelanggan',
				'/pengeluaran',
				'/shift',
				'/pengaturan',
				'/pengguna'
			];
			for (const route of forbiddenForOperator) {
				await page.goto(route);
				await expect(page, `Operator tidak boleh mengakses ${route}`).toHaveURL(/\/order/);
			}

			guards.assertNoErrors();
		} finally {
			await ctx.close();
		}
	});

	test('role admin: diizinkan di operasional & kasir, ditolak di /pengaturan & /pengguna', async ({
		browser
	}) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.admin });
		const page = await ctx.newPage();
		const guards = attachErrorGuards(page);

		try {
			// Diizinkan
			for (const route of ['/dashboard', '/kasir', '/order', '/laporan']) {
				await page.goto(route);
				await expect(page).toHaveURL(new RegExp(route));
			}

			// Khusus owner -> admin harus diarahkan ke /dashboard
			for (const ownerOnly of ['/pengaturan', '/pengguna']) {
				await page.goto(ownerOnly);
				await expect(page, `Admin tidak boleh mengakses ${ownerOnly}`).toHaveURL(/\/dashboard/);
			}

			guards.assertNoErrors();
		} finally {
			await ctx.close();
		}
	});

	test('role owner: memiliki akses penuh ke /pengaturan dan /pengguna', async ({ browser }) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const page = await ctx.newPage();
		const guards = attachErrorGuards(page);

		try {
			await page.goto('/pengaturan');
			await expect(page).toHaveURL(/\/pengaturan/);
			await expect(page.locator('h1')).toBeVisible();

			await page.goto('/pengguna');
			await expect(page).toHaveURL(/\/pengguna/);
			await expect(page.locator('h1')).toBeVisible();

			guards.assertNoErrors();
		} finally {
			await ctx.close();
		}
	});

	test('redirect sudah login: membuka /sign-in langsung diarahkan ke home masing-masing role', async ({
		browser
	}) => {
		const ownerCtx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const operatorCtx = await browser.newContext({ storageState: AUTH_FILES.operator });

		try {
			const ownerPage = await ownerCtx.newPage();
			const ownerGuards = attachErrorGuards(ownerPage);
			await ownerPage.goto('/sign-in');
			await expect(ownerPage).toHaveURL(/\/dashboard/);
			ownerGuards.assertNoErrors();

			const operatorPage = await operatorCtx.newPage();
			const operatorGuards = attachErrorGuards(operatorPage);
			await operatorPage.goto('/sign-in');
			await expect(operatorPage).toHaveURL(/\/order/);
			operatorGuards.assertNoErrors();
		} finally {
			await ownerCtx.close();
			await operatorCtx.close();
		}
	});
});
