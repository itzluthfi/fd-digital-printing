import { test, expect } from '@playwright/test';
import { attachErrorGuards } from './helpers';

test.describe('Landing Page E2E Test', () => {
	test('halaman utama berhasil dimuat dengan judul, branding, dan navigasi utama', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/');

		await expect(page).toHaveTitle(/FD Digital Printing/);

		const header = page.locator('header');
		await expect(header.getByText('FD Digital Printing')).toBeVisible();
		await expect(header.getByText('Company Profile')).toBeVisible();
		await expect(header.getByRole('link', { name: /E-Commerce Toko/i })).toHaveAttribute('href', '/katalog');
		await expect(header.getByRole('link', { name: /Lacak Order/i })).toHaveAttribute('href', '/status-order');
		await expect(header.getByRole('link', { name: /Masuk/i })).toHaveAttribute('href', '/sign-in');

		await expect(page.locator('h1')).toContainText(/Mitra Percetakan Digital/i);
		guards.assertNoErrors();
	});

	test('menampilkan 5 langkah alur pemesanan cetak dan persyaratan file', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/');

		const alurSection = page.locator('#alur-order');
		await expect(alurSection.getByRole('heading', { name: 'Alur Pemesanan Online' })).toBeVisible();
		await expect(alurSection.getByRole('heading', { name: 'Pilih Produk di Katalog Website' })).toBeVisible();
		await expect(alurSection.getByRole('heading', { name: 'Pilih Produk dan Lakukan Pemesanan' })).toBeVisible();
		await expect(alurSection.getByRole('heading', { name: 'Lakukan Pembayaran' })).toBeVisible();
		await expect(alurSection.getByRole('heading', { name: 'Konfirmasi melalui WhatsApp' })).toBeVisible();
		await expect(alurSection.getByRole('heading', { name: 'Tunggu Notifikasi Pesanan Selesai' })).toBeVisible();
		await expect(alurSection.getByRole('heading', { name: 'Persyaratan File dan Data Pemesanan' })).toBeVisible();

		guards.assertNoErrors();
	});

	test('menampilkan informasi kontak dan FAQ percetakan', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/');

		await expect(page.getByText('Jl. Raya Wadungasri No. 42').first()).toBeVisible();
		await expect(page.getByText('Belum punya file desain, apakah bisa dibantu?')).toBeVisible();

		guards.assertNoErrors();
	});
});
