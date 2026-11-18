import { test, expect } from '@playwright/test';
import { AUTH_FILES, attachErrorGuards } from './helpers';

test.describe('Back-Office Operational Flows & Admin Modules', () => {
	test.use({ storageState: AUTH_FILES.owner });

	test('kasir POS -> buat transaksi cash + diskon -> verifikasi invoice & struk thermal', async ({
		page
	}) => {
		const guards = attachErrorGuards(page);
		const uniqueTag = `E2E-KASIR-${Date.now()}`;
		const customerName = `Pelanggan ${uniqueTag}`;
		const desc = `Cetak Banner Uji ${uniqueTag}`;

		await page.goto('/kasir');
		await expect(page.locator('h1')).toContainText('Kasir');

		// Pilih walk-in / pelanggan baru
		await page.locator('#pelanggan').selectOption('baru');
		await page.locator('#namaBaru').fill(customerName);
		await page.locator('#teleponBaru').fill('081299990001');

		// Isi transaksi cash Rp 50.000 - diskon Rp 5.000 = Rp 45.000, bayar Rp 50.000 -> kembalian Rp 5.000
		await page.locator('#description').fill(desc);
		await page.locator('#total').fill('50000');
		await page.locator('#discountValue').fill('5000');
		await page.locator('#dibayar').fill('50000');

		await expect(page.getByText('Kembalian:')).toBeVisible();
		await expect(page.getByText('Kembalian:').locator('..')).toContainText(/Rp\s*5\.000/);

		// Submit transaksi & verifikasi redirect ke halaman invoice
		await page.getByRole('button', { name: /Simpan transaksi/i }).click();
		await expect(page).toHaveURL(/\/kasir\/invoice\/\d+/, { timeout: 15_000 });

		const match = page.url().match(/\/kasir\/invoice\/(\d+)/);
		expect(match).not.toBeNull();
		const orderId = match![1];

		await expect(page.getByText(desc).first()).toBeVisible();
		await expect(page.getByText(customerName).first()).toBeVisible();

		// Verifikasi struk thermal 58mm (/kasir/struk/[id])
		await page.goto(`/kasir/struk/${orderId}`);
		await expect(page.getByText(desc).first()).toBeVisible();
		await expect(page.getByText(/FD Digital Printing/i).first()).toBeVisible();

		guards.assertNoErrors();
	});

	test('pipeline antrean order: ubah status baru -> diproses -> selesai dan persisten setelah reload', async ({
		page
	}) => {
		const guards = attachErrorGuards(page);
		const uniqueTag = `E2E-PIPE-${Date.now()}`;
		const desc = `Order Pipeline ${uniqueTag}`;

		// Buat order baru lewat kasir terlebih dulu
		await page.goto('/kasir');
		await page.locator('#pelanggan').selectOption('baru');
		await page.locator('#namaBaru').fill(`Client ${uniqueTag}`);
		await page.locator('#teleponBaru').fill('081299990002');
		await page.locator('#description').fill(desc);
		await page.locator('#total').fill('25000');
		await page.locator('#dibayar').fill('25000');
		const postPromise = page.waitForResponse(
			(r) => r.url().includes('/kasir') && r.request().method() === 'POST'
		);
		await page.getByRole('button', { name: /Simpan transaksi/i }).click();
		const postRes = await postPromise;
		expect(postRes.status(), `POST /kasir returned ${postRes.status()}: ${await postRes.text()}`).toBeLessThan(400);
		await expect(page).toHaveURL(/\/kasir\/invoice\/\d+/, { timeout: 15_000 });

		// Buka halaman antrean order & cari order baru
		await page.goto('/order');
		await expect(page.locator('h1')).toContainText('Antrean Order');

		const searchInput = page.locator('input[type="search"], input[placeholder*="Cari"]').first();
		await searchInput.fill(uniqueTag);
		await expect(page.getByText(desc).first()).toBeVisible();

		// 1. Transisi: baru -> diproses
		await page.getByRole('button', { name: /Mulai Proses/i }).first().click();
		await expect(page.getByRole('button', { name: /Tandai Selesai/i }).first()).toBeVisible({
			timeout: 10_000
		});

		// 2. Transisi: diproses -> selesai
		await page.getByRole('button', { name: /Tandai Selesai/i }).first().click();
		await expect(page.getByRole('button', { name: /Ambil Pesanan/i }).first()).toBeVisible({
			timeout: 10_000
		});

		// 3. Reload halaman dan pastikan status selesai persisten di SQLite
		await page.reload();
		await page.locator('input[type="search"], input[placeholder*="Cari"]').first().fill(uniqueTag);
		await expect(page.getByRole('button', { name: /Ambil Pesanan/i }).first()).toBeVisible();

		guards.assertNoErrors();
	});

	test('katalog harga (/harga): menampilkan daftar item & pencarian berjalan', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/harga');

		await expect(page.locator('h1')).toBeVisible();
		const searchInput = page.locator('input[type="search"], input[placeholder*="Cari"]').first();
		await expect(searchInput).toBeVisible();
		await searchInput.fill('Stiker');
		await expect(page.getByText(/Stiker/i).first()).toBeVisible();

		guards.assertNoErrors();
	});

	test('laporan omzet (/laporan): tab periode dan tautan export CSV tersedia', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/laporan');

		await expect(page.locator('h1')).toContainText('Laporan Omzet');
		await expect(page.getByText('Total Omzet')).toBeVisible();

		const csvLink = page.getByRole('link', { name: /Unduh CSV/i });
		await expect(csvLink).toBeVisible();
		await expect(csvLink).toHaveAttribute('href', /\/api\/export\?jenis=omzet/);

		// Uji pindah periode mingguan
		await page.getByRole('link', { name: 'Mingguan', exact: true }).click();
		await expect(page).toHaveURL(/\/laporan\?periode=mingguan/);

		guards.assertNoErrors();
	});

	test('rekap shift kasir (/shift): halaman shift termuat bersih dengan form operasional', async ({
		page
	}) => {
		const guards = attachErrorGuards(page);
		await page.goto('/shift');

		await expect(page.locator('h1')).toContainText('Rekap Shift Kasir');
		await expect(page.getByRole('heading', { name: /Riwayat shift/i })).toBeVisible();
		await expect(page.locator('form button[type="submit"]').first()).toBeVisible();

		guards.assertNoErrors();
	});

	test('log notifikasi (/notifikasi): filter kanal dan status dapat digunakan', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/notifikasi');

		await expect(page.locator('h1')).toBeVisible();
		const allChannelChip = page.getByRole('button', { name: /Semua Kanal/i });
		await expect(allChannelChip).toBeVisible();
		await page.getByRole('button', { name: 'Telegram', exact: true }).click();

		guards.assertNoErrors();
	});

	test('manajemen pengguna (/pengguna): menampilkan akun staf terdaftar', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/pengguna');

		await expect(page.locator('h1')).toBeVisible();
		await expect(page.getByText('owner@fd.local').first()).toBeVisible();
		await expect(page.getByText('admin@fd.local').first()).toBeVisible();
		await expect(page.getByText('operator@fd.local').first()).toBeVisible();

		guards.assertNoErrors();
	});

	test('pengaturan sistem (/pengaturan): halaman konfigurasi owner termuat lengkap', async ({
		page
	}) => {
		const guards = attachErrorGuards(page);
		await page.goto('/pengaturan');

		await expect(page.locator('h1')).toBeVisible();
		await expect(page.locator('main')).toBeVisible();

		guards.assertNoErrors();
	});
});
