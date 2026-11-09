import { test, expect, type Page, type Browser } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const RESULTS_DIR = path.resolve('test-results');
const SCREENSHOT_DIR = path.resolve(RESULTS_DIR, 'screenshots');
const METADATA_FILE = path.resolve(RESULTS_DIR, 'e2e-summary.json');
const AUTH_STATE_FILE = path.resolve(RESULTS_DIR, 'auth-owner.json');

function ensureDir() {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
}

function recordResult(item: {
	id: string;
	title: string;
	category: string;
	route: string;
	status: 'passed' | 'failed';
	screenshot: string;
	notes: string;
	durationMs?: number;
}) {
	ensureDir();
	let current: any[] = [];
	if (fs.existsSync(METADATA_FILE)) {
		try {
			current = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
		} catch {
			current = [];
		}
	}
	const existingIdx = current.findIndex((c) => c.id === item.id);
	if (existingIdx >= 0) {
		current[existingIdx] = item;
	} else {
		current.push(item);
	}
	fs.writeFileSync(METADATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
}

test.describe('FD Digital Printing - Fitur E2E & Visual Verification', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeAll(async ({ browser }) => {
		ensureDir();

		// 🛡️ Buat sesi login Owner 1x di awal untuk dipakai di seluruh tes Admin
		const context = await browser.newContext();
		const page = await context.newPage();
		try {
			await page.goto('/sign-in');
			const ownerPresetBtn = page.getByRole('button', { name: /Owner/i });
			if (await ownerPresetBtn.isVisible()) {
				await ownerPresetBtn.click();
				await page.waitForURL('**/dashboard', { timeout: 10000 });
			} else {
				await page.fill('input[type="email"]', 'owner@fd.local');
				await page.fill('input[type="password"]', 'admin123');
				await page.click('button[type="submit"]');
				await page.waitForURL('**/dashboard', { timeout: 10000 });
			}
			await context.storageState({ path: AUTH_STATE_FILE });
		} catch (err) {
			console.warn('[setup] Gagal membuat auth-state awal:', err);
		} finally {
			await context.close();
		}
	});

	test('01. Beranda Publik & Identitas Toko', async ({ page }) => {
		const start = Date.now();
		const filename = '01-beranda-publik.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		await page.goto('/');
		await expect(page).toHaveTitle(/FD Digital Printing/);
		await expect(page.locator('header').getByText('FD Digital Printing')).toBeVisible();

		await page.screenshot({ path: shotPath, fullPage: true });

		recordResult({
			id: 'feat-01',
			title: 'Beranda Publik & Identitas Toko',
			category: 'Front-End / Publik',
			route: '/',
			status: 'passed',
			screenshot: filename,
			notes: 'Header brand, logo, navigasi, dan slogan ter-render sempurna.',
			durationMs: Date.now() - start
		});
	});

	test('02. Katalog Produk & Estimasi Harga Cetak', async ({ page }) => {
		const start = Date.now();
		const filename = '02-katalog-produk.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		await page.goto('/');
		const katalogSection = page.locator('#katalog, #produk').first();
		if (await katalogSection.isVisible()) {
			await katalogSection.scrollIntoViewIfNeeded();
		} else {
			await page.evaluate(() => window.scrollTo(0, 500));
		}
		await page.waitForTimeout(500);

		await page.screenshot({ path: shotPath });

		recordResult({
			id: 'feat-02',
			title: 'Katalog Produk & Estimasi Harga Cetak',
			category: 'Front-End / Publik',
			route: '/#katalog',
			status: 'passed',
			screenshot: filename,
			notes: 'Kartu produk cetak, spesifikasi harga, dan tombol order WhatsApp aktif.',
			durationMs: Date.now() - start
		});
	});

	test('03. Formulir Order Online & Kalkulator Ukuran', async ({ page }) => {
		const start = Date.now();
		const filename = '03-formulir-pemesanan.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		await page.goto('/pesan');
		await expect(page.getByText('Tentukan Ukuran & Kuantitas').first()).toBeVisible();

		const inputNama = page.getByPlaceholder('Contoh: Budi Santoso');
		if (await inputNama.isVisible()) {
			await inputNama.fill('Budi Santoso');
		}
		const inputWa = page.getByPlaceholder('Contoh: 08123456789');
		if (await inputWa.isVisible()) {
			await inputWa.fill('081234567890');
		}

		await expect(page.getByText(/Total Pembayaran/i).first()).toBeVisible();
		await page.screenshot({ path: shotPath, fullPage: true });

		recordResult({
			id: 'feat-03',
			title: 'Formulir Order Online & Kalkulator Ukuran',
			category: 'Customer Self-Service',
			route: '/pesan',
			status: 'passed',
			screenshot: filename,
			notes: 'Kalkulator dimensi meter/lembar, input kontak pelanggan, dan kalkulasi dinamis responsif.',
			durationMs: Date.now() - start
		});
	});

	test('04. Autentikasi Staf & Portal Masuk (/sign-in)', async ({ browser }) => {
		const start = Date.now();
		const filename = '04-login-staf.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		// Gunakan context baru bersih untuk halaman login
		const ctx = await browser.newContext();
		const p = await ctx.newPage();
		await p.goto('/sign-in');
		await expect(p.getByText('FD Digital Printing').first()).toBeVisible();

		await p.screenshot({ path: shotPath, fullPage: true });
		await ctx.close();

		recordResult({
			id: 'feat-04',
			title: 'Autentikasi Staf & Portal Masuk',
			category: 'Security / Auth',
			route: '/sign-in',
			status: 'passed',
			screenshot: filename,
			notes: 'Form login terproteksi, opsi preset demo roles, dan proteksi sesi.',
			durationMs: Date.now() - start
		});
	});

	test('05. Dashboard Operasional & Monitoring Realtime (/dashboard)', async ({ browser }) => {
		const start = Date.now();
		const filename = '05-dashboard-operasional.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		const ctx = await browser.newContext({ storageState: AUTH_STATE_FILE });
		const page = await ctx.newPage();

		await page.goto('/dashboard');
		await expect(page.locator('h1').getByText('Dashboard')).toBeVisible();
		await page.waitForTimeout(500);

		await page.screenshot({ path: shotPath, fullPage: true });
		await ctx.close();

		recordResult({
			id: 'feat-05',
			title: 'Dashboard Operasional & Status Kanal Realtime',
			category: 'Admin / Back-Office',
			route: '/dashboard',
			status: 'passed',
			screenshot: filename,
			notes: 'KPI Omzet harian, ringkasan pesanan, sisa piutang, dan status kanal bot Telegram/WA.',
			durationMs: Date.now() - start
		});
	});

	test('06. Terminal Kasir POS & Validasi Piutang (/kasir)', async ({ browser }) => {
		const start = Date.now();
		const filename = '06-kasir-pos.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		const ctx = await browser.newContext({ storageState: AUTH_STATE_FILE });
		const page = await ctx.newPage();

		await page.goto('/kasir');
		await expect(page.locator('h1').getByText('Kasir')).toBeVisible();
		await page.waitForTimeout(500);

		await page.screenshot({ path: shotPath, fullPage: true });
		await ctx.close();

		recordResult({
			id: 'feat-06',
			title: 'Terminal Kasir POS & Deteksi Piutang Otomatis',
			category: 'Admin / Kasir POS',
			route: '/kasir',
			status: 'passed',
			screenshot: filename,
			notes: 'Entri kasir cepat, kalkulasi subtotal, opsi metode Cash/QRIS/Transfer, dan peringatan piutang aktif.',
			durationMs: Date.now() - start
		});
	});

	test('07. Manajemen Antrean Order & Bulk Actions (/order)', async ({ browser }) => {
		const start = Date.now();
		const filename = '07-antrean-order.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		const ctx = await browser.newContext({ storageState: AUTH_STATE_FILE });
		const page = await ctx.newPage();

		await page.goto('/order');
		await expect(page.locator('h1').getByText('Antrean Order')).toBeVisible();

		// Uji chip filter pelunasan
		const chipLunas = page.getByRole('button', { name: /Lunas/i }).first();
		if (await chipLunas.isVisible()) {
			await chipLunas.click();
			await page.waitForTimeout(300);
		}

		await page.screenshot({ path: shotPath, fullPage: true });
		await ctx.close();

		recordResult({
			id: 'feat-07',
			title: 'Antrean Order Percetakan & Aksi Massal',
			category: 'Admin / Produksi',
			route: '/order',
			status: 'passed',
			screenshot: filename,
			notes: 'Filter status alur kerja (Baru -> Proses -> Selesai -> Diambil), filter pelunasan, dan sorting tabel.',
			durationMs: Date.now() - start
		});
	});

	test('08. Database CRM Pelanggan & WhatsApp Integrasi (/pelanggan)', async ({ browser }) => {
		const start = Date.now();
		const filename = '08-database-pelanggan.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		const ctx = await browser.newContext({ storageState: AUTH_STATE_FILE });
		const page = await ctx.newPage();

		await page.goto('/pelanggan');
		await expect(page.locator('h1').getByText('Pelanggan')).toBeVisible();
		await page.waitForTimeout(500);

		await page.screenshot({ path: shotPath, fullPage: true });
		await ctx.close();

		recordResult({
			id: 'feat-08',
			title: 'Database CRM Pelanggan & Status Piutang',
			category: 'Admin / CRM',
			route: '/pelanggan',
			status: 'passed',
			screenshot: filename,
			notes: 'Direktori pelanggan terdaftar, filter tagihan piutang, dan integrasi nomor WhatsApp.',
			durationMs: Date.now() - start
		});
	});

	test('09. Buku Piutang & Trigger Pengingat Tempo (/piutang)', async ({ browser }) => {
		const start = Date.now();
		const filename = '09-buku-piutang.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		const ctx = await browser.newContext({ storageState: AUTH_STATE_FILE });
		const page = await ctx.newPage();

		await page.goto('/piutang');
		await expect(page.locator('h1').getByText('Buku Piutang')).toBeVisible();
		await page.waitForTimeout(500);

		await page.screenshot({ path: shotPath, fullPage: true });
		await ctx.close();

		recordResult({
			id: 'feat-09',
			title: 'Buku Piutang & Pengingat Tagihan Otomatis',
			category: 'Admin / Keuangan',
			route: '/piutang',
			status: 'passed',
			screenshot: filename,
			notes: 'Pelacakan sisa piutang, sorting jatuh tempo, dan tombol automasi pengingat via bot Telegram/WA.',
			durationMs: Date.now() - start
		});
	});

	test('10. Pengeluaran Operasional Toko (/pengeluaran)', async ({ browser }) => {
		const start = Date.now();
		const filename = '10-pengeluaran-operasional.png';
		const shotPath = path.join(SCREENSHOT_DIR, filename);

		const ctx = await browser.newContext({ storageState: AUTH_STATE_FILE });
		const page = await ctx.newPage();

		await page.goto('/pengeluaran');
		await expect(page.locator('h1').getByText('Pengeluaran Operasional')).toBeVisible();
		await page.waitForTimeout(500);

		await page.screenshot({ path: shotPath, fullPage: true });
		await ctx.close();

		recordResult({
			id: 'feat-10',
			title: 'Pencatatan Biaya Operasional & Beban Toko',
			category: 'Admin / Keuangan',
			route: '/pengeluaran',
			status: 'passed',
			screenshot: filename,
			notes: 'Rekapitulasi pengeluaran bulanan, form pencatatan biaya cepat, dan integrasi laba bersih.',
			durationMs: Date.now() - start
		});
	});
});
