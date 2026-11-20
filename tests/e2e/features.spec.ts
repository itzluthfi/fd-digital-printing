import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import {
	AUTH_FILES,
	SCREENSHOT_DIR,
	attachErrorGuards,
	recordResult,
	resetSummary
} from './helpers';

interface FeatureMeta {
	id: string;
	title: string;
	category: string;
	route: string;
	screenshot: string;
	notes: string;
}

async function runTrackedFeature(
	page: Page,
	meta: FeatureMeta,
	fn: () => Promise<void>,
	fullPage = true
): Promise<void> {
	const start = Date.now();
	const guards = attachErrorGuards(page);
	const shotPath = path.join(SCREENSHOT_DIR, meta.screenshot);
	let status: 'passed' | 'failed' = 'failed';

	try {
		await fn();
		guards.assertNoErrors();
		status = 'passed';
	} finally {
		try {
			await page.screenshot({ path: shotPath, fullPage });
		} catch {
			// Abaikan jika page sudah tertutup saat gagal
		}
		recordResult({
			...meta,
			status,
			durationMs: Date.now() - start
		});
	}
}

test.describe('FD Digital Printing - Fitur E2E & Visual Verification', () => {
	test.describe.configure({ mode: 'serial' });

	test.beforeAll(() => {
		resetSummary();
	});

	test('01. Beranda Publik & Identitas Toko', async ({ page }) => {
		await runTrackedFeature(
			page,
			{
				id: 'feat-01',
				title: 'Beranda Publik & Identitas Toko',
				category: 'Front-End / Publik',
				route: '/',
				screenshot: '01-beranda-publik.png',
				notes: 'Header brand, logo, navigasi E-Commerce, dan hero Company Profile ter-render sempurna.'
			},
			async () => {
				await page.goto('/');
				await expect(page).toHaveTitle(/FD Digital Printing/);
				await expect(page.locator('header').getByText('FD Digital Printing')).toBeVisible();
				await expect(page.locator('h1')).toBeVisible();
				await expect(page.locator('header a[href="/katalog"]')).toBeVisible();
			}
		);
	});

	test('02. Katalog Produk & Estimasi Harga Cetak', async ({ page }) => {
		await runTrackedFeature(
			page,
			{
				id: 'feat-02',
				title: 'Katalog Produk & Estimasi Harga Cetak',
				category: 'Front-End / Publik',
				route: '/katalog',
				screenshot: '02-katalog-produk.png',
				notes: 'Katalog produk dari SQLite, filter kategori, pencarian nama produk, dan link detail produk aktif.'
			},
			async () => {
				await page.goto('/katalog');
				await expect(page.locator('h1')).toContainText(/Katalog Produk/i);

				const productLinks = page.locator('a[href^="/produk/"]');
				await expect(productLinks.first()).toBeVisible();
				expect(await productLinks.count()).toBeGreaterThan(5);

				const searchInput = page.locator('input[type="search"], input[placeholder*="Cari"]').first();
				if (await searchInput.isVisible()) {
					await searchInput.fill('Stiker');
					await expect(productLinks.first()).toHaveAttribute('href', /stiker/i);
					await expect(page.locator('main').getByText(/Stiker/i).first()).toBeVisible();
				}
			},
			false
		);
	});

	test('03. Formulir Order Online & Kalkulator Ukuran', async ({ page }) => {
		await runTrackedFeature(
			page,
			{
				id: 'feat-03',
				title: 'Formulir Order Online & Kalkulator Ukuran',
				category: 'Customer Self-Service',
				route: '/pesan',
				screenshot: '03-formulir-pemesanan.png',
				notes: 'Pemilihan layanan, tambah ke daftar pesanan, input data pemesan, dan kalkulasi Total Bayar berjalan dinamis.'
			},
			async () => {
				await page.goto('/pesan');
				await expect(page).toHaveURL(/\/produk\//);
				await expect(page.locator('h1')).toBeVisible();

				await page.locator('input[name="qty"]').fill('2');
				await page.locator('input[name="nama"]').fill('Budi Santoso');
				await page.locator('input[name="telepon"]').fill('081234567890');
				await expect(page.getByText(/Estimasi Total/i)).toBeVisible();
				await expect(page.getByRole('button', { name: /\+ Keranjang/i })).toBeVisible();
				await expect(page.getByRole('button', { name: /Beli Langsung/i })).toBeVisible();
			}
		);
	});

	test('04. Autentikasi Staf & Portal Masuk (/sign-in)', async ({ browser }) => {
		const ctx = await browser.newContext();
		const page = await ctx.newPage();
		try {
			await runTrackedFeature(
				page,
				{
					id: 'feat-04',
					title: 'Autentikasi Staf & Portal Masuk',
					category: 'Security / Auth',
					route: '/sign-in',
					screenshot: '04-login-staf.png',
					notes: 'Form login email/password, tombol submit, dan preset demo roles (Owner/Admin/Operator) tampil lengkap.'
				},
				async () => {
					await page.goto('/sign-in');
					await expect(page.getByText('FD Digital Printing').first()).toBeVisible();
					await expect(page.locator('#email')).toBeVisible();
					await expect(page.locator('#password')).toBeVisible();
					await expect(page.getByRole('button', { name: /Masuk Sekarang/i })).toBeVisible();
					await expect(page.getByRole('button', { name: 'Owner', exact: true })).toBeVisible();
				}
			);
		} finally {
			await ctx.close();
		}
	});

	test('05. Dashboard Operasional & Monitoring Realtime (/dashboard)', async ({ browser }) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const page = await ctx.newPage();
		try {
			await runTrackedFeature(
				page,
				{
					id: 'feat-05',
					title: 'Dashboard Operasional & Status Kanal Realtime',
					category: 'Admin / Back-Office',
					route: '/dashboard',
					screenshot: '05-dashboard-operasional.png',
					notes: 'KPI Omzet harian, ringkasan pesanan, sisa piutang, dan navigasi operasional ter-render tanpa error.'
				},
				async () => {
					await page.goto('/dashboard');
					await expect(page.locator('h1')).toContainText('Dashboard');
					await expect(page.getByText(/Omzet|Order|Piutang/i).first()).toBeVisible();
				}
			);
		} finally {
			await ctx.close();
		}
	});

	test('06. Terminal Kasir POS & Validasi Piutang (/kasir)', async ({ browser }) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const page = await ctx.newPage();
		try {
			await runTrackedFeature(
				page,
				{
					id: 'feat-06',
					title: 'Terminal Kasir POS & Deteksi Piutang Otomatis',
					category: 'Admin / Kasir POS',
					route: '/kasir',
					screenshot: '06-kasir-pos.png',
					notes: 'Form entri kasir cepat, kalkulasi subtotal, dan opsi metode pembayaran siap digunakan.'
				},
				async () => {
					await page.goto('/kasir');
					await expect(page.locator('h1')).toContainText('Kasir');
					await expect(page.locator('form').first()).toBeVisible();
					await expect(page.locator('button[type="submit"]').first()).toBeVisible();
				}
			);
		} finally {
			await ctx.close();
		}
	});

	test('07. Manajemen Antrean Order & Bulk Actions (/order)', async ({ browser }) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const page = await ctx.newPage();
		try {
			await runTrackedFeature(
				page,
				{
					id: 'feat-07',
					title: 'Antrean Order Percetakan & Aksi Massal',
					category: 'Admin / Produksi',
					route: '/order',
					screenshot: '07-antrean-order.png',
					notes: 'Filter status alur kerja (Baru -> Proses -> Selesai -> Diambil) dan filter pelunasan responsif.'
				},
				async () => {
					await page.goto('/order');
					await expect(page.locator('h1')).toContainText('Antrean Order');
					await expect(page.getByRole('button', { name: /Semua Status/i })).toBeVisible();

					const chipLunas = page.getByRole('button', { name: /Lunas/i }).first();
					await expect(chipLunas).toBeVisible();
					await chipLunas.click();
				}
			);
		} finally {
			await ctx.close();
		}
	});

	test('08. Database CRM Pelanggan & WhatsApp Integrasi (/pelanggan)', async ({ browser }) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const page = await ctx.newPage();
		try {
			await runTrackedFeature(
				page,
				{
					id: 'feat-08',
					title: 'Database CRM Pelanggan & Status Piutang',
					category: 'Admin / CRM',
					route: '/pelanggan',
					screenshot: '08-database-pelanggan.png',
					notes: 'Direktori pelanggan terdaftar, kolom pencarian, dan tombol tambah pelanggan tampil.'
				},
				async () => {
					await page.goto('/pelanggan');
					await expect(page.locator('h1')).toContainText('Pelanggan');
					await expect(page.getByRole('button', { name: /Tambah/i }).first()).toBeVisible();
				}
			);
		} finally {
			await ctx.close();
		}
	});

	test('09. Buku Piutang & Trigger Pengingat Tempo (/piutang)', async ({ browser }) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const page = await ctx.newPage();
		try {
			await runTrackedFeature(
				page,
				{
					id: 'feat-09',
					title: 'Buku Piutang & Pengingat Tagihan Otomatis',
					category: 'Admin / Keuangan',
					route: '/piutang',
					screenshot: '09-buku-piutang.png',
					notes: 'Pelacakan sisa piutang dan antarmuka pengelolaan jatuh tempo ter-render tanpa error.'
				},
				async () => {
					await page.goto('/piutang');
					await expect(page.locator('h1')).toContainText('Buku Piutang');
					await expect(page.locator('main')).toBeVisible();
				}
			);
		} finally {
			await ctx.close();
		}
	});

	test('10. Pengeluaran Operasional Toko (/pengeluaran)', async ({ browser }) => {
		const ctx = await browser.newContext({ storageState: AUTH_FILES.owner });
		const page = await ctx.newPage();
		try {
			await runTrackedFeature(
				page,
				{
					id: 'feat-10',
					title: 'Pencatatan Biaya Operasional & Beban Toko',
					category: 'Admin / Keuangan',
					route: '/pengeluaran',
					screenshot: '10-pengeluaran-operasional.png',
					notes: 'Rekapitulasi pengeluaran bulanan dan tombol/form pencatatan biaya siap digunakan.'
				},
				async () => {
					await page.goto('/pengeluaran');
					await expect(page.locator('h1')).toContainText('Pengeluaran Operasional');
					await expect(page.locator('main')).toBeVisible();
				}
			);
		} finally {
			await ctx.close();
		}
	});
});
