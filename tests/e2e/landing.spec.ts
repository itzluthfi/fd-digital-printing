import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Test', () => {
	test('halaman utama berhasil dimuat dengan judul dan branding yang benar', async ({ page }) => {
		await page.goto('/');

		// Verifikasi judul tab browser
		await expect(page).toHaveTitle(/FD Digital Printing/);

		// Verifikasi brand navbar terlihat
		const brandHeading = page.locator('header').getByText('FD Digital Printing');
		await expect(brandHeading).toBeVisible();

		// Verifikasi slogan terlihat
		const slogan = page.locator('header').getByText('Cetak cepat, hasil hebat');
		await expect(slogan).toBeVisible();
	});

	test('menampilkan alur langkah pemesanan cetak', async ({ page }) => {
		await page.goto('/');

		// Verifikasi 3 langkah pemesanan
		await expect(page.getByText('Pilih Produk')).toBeVisible();
		await expect(page.getByText('Kirim Desain')).toBeVisible();
		await expect(page.getByText('Cetak & Ambil')).toBeVisible();
	});

	test('menampilkan informasi kontak dan FAQ percetakan', async ({ page }) => {
		await page.goto('/');

		// Verifikasi bagian kontak
		await expect(page.getByText('Jl. Raya Wadungasri No. 42').first()).toBeVisible();

		// Verifikasi salah satu pertanyaan umum FAQ
		await expect(page.getByText('Belum punya file desain, apakah bisa dibantu?')).toBeVisible();
	});
});

