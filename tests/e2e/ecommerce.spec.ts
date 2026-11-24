import { test, expect } from '@playwright/test';
import { attachErrorGuards } from './helpers';

test.describe('Customer E-Commerce Flow (Catalog, Cart, Checkout, Tracking & Machines)', () => {
	test('katalog produk: menampilkan produk DB, filter kategori, dan pencarian', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/katalog');

		await expect(page.locator('h1')).toContainText(/Katalog Produk/i);

		const cards = page.locator('a[href^="/produk/"]');
		await expect(cards.first()).toBeVisible();
		const initialCount = await cards.count();
		expect(initialCount).toBeGreaterThan(10);

		// Uji filter kategori Stiker
		const stikerTab = page.getByRole('button', { name: 'Stiker', exact: true });
		await expect(stikerTab).toBeVisible();
		await stikerTab.click({ force: true });
		const stikerCount = await cards.count();
		expect(stikerCount).toBeGreaterThan(0);
		expect(stikerCount).toBeLessThan(initialCount);

		// Uji pencarian teks
		const searchInput = page.locator('input[placeholder="Cari produk cetak..."]');
		await searchInput.fill('Vinyl');
		await expect(page.locator('main h3').first()).toContainText(/Vinyl/i);

		guards.assertNoErrors();
	});

	test('detail produk: kalkulasi harga, opsi finishing, dan tambah ke keranjang', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/katalog');

		// Buka halaman detail produk pertama
		const firstProduct = page.locator('a[href^="/produk/"]').first();
		await firstProduct.waitFor({ state: 'visible' });
		const productHref = (await firstProduct.getAttribute('href')) || '/katalog';
		await page.goto(productHref);
		await expect(page).toHaveURL(/\/produk\//);
		await expect(page.locator('h1')).toBeVisible();

		// Ubah qty dan pastikan Estimasi Total terlihat & berubah
		const estimasiEl = page.locator('text=Estimasi Total:').locator('..').locator('span').last();
		const initialPriceText = await estimasiEl.textContent();

		const qtyInput = page.locator('input[name="qty"]');
		await qtyInput.fill('3');
		await expect(estimasiEl).not.toHaveText(initialPriceText ?? '');

		// Uji dropdown Select2 finishing jika tersedia pada produk
		const finishingTrigger = page.locator('#finishing-trigger');
		if (await finishingTrigger.isVisible()) {
			await finishingTrigger.click({ force: true });
			const options = page.getByRole('option');
			await expect(options.first()).toBeVisible();
			if ((await options.count()) > 1) {
				await options.nth(1).click({ force: true });
			} else {
				await options.first().click({ force: true });
			}
		}

		// Tambahkan ke keranjang
		const tambahBtn = page.getByRole('button', { name: /\+ Keranjang/i });
		await tambahBtn.scrollIntoViewIfNeeded();
		await tambahBtn.click();
		await expect(page.getByText(/Berhasil ditambahkan/i)).toBeVisible();

		// Verifikasi link keranjang menampilkan badge jumlah > 0
		await page.goto('/cart');
		await expect(page.locator('h1')).toContainText(/Daftar Belanja Anda/i);
		await expect(page.getByText(/Keranjang Belanja Masih Kosong/i)).toBeHidden();

		guards.assertNoErrors();
	});

	test('keranjang belanja: update kuantitas memperbarui subtotal & hapus item', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/katalog');
		const firstProduct = page.locator('a[href^="/produk/"]').first();
		await firstProduct.waitFor({ state: 'visible' });
		const productHref = (await firstProduct.getAttribute('href')) || '/katalog';
		await page.goto(productHref);
		await expect(page).toHaveURL(/\/produk\//);

		const tambahBtn = page.getByRole('button', { name: /\+ Keranjang/i });
		await tambahBtn.scrollIntoViewIfNeeded();
		await tambahBtn.click();
		await expect(page.getByText(/Berhasil ditambahkan/i)).toBeVisible();

		await page.goto('/cart');

		const totalAkhir = page.locator('text=Total Akhir:').locator('..').locator('span').last();
		await expect(totalAkhir).toBeVisible();
		const priceBefore = await totalAkhir.textContent();

		// Klik tombol + pada item pertama (tombol kedua dalam counter qty)
		const qtyBox = page.locator('main button:has(svg.lucide-plus)').first();
		await qtyBox.scrollIntoViewIfNeeded();
		await qtyBox.click();
		await expect(totalAkhir).not.toHaveText(priceBefore ?? '');

		// Hapus item dan pastikan empty state tampil
		const hapusBtn = page.locator('button[title="Hapus dari keranjang"]').first();
		await hapusBtn.scrollIntoViewIfNeeded();
		await hapusBtn.click();
		await expect(page.getByText(/Keranjang Belanja Masih Kosong/i)).toBeVisible();

		guards.assertNoErrors();
	});

	test('checkout end-to-end: submit order QRIS, halaman sukses, dan lacak pesanan', async ({
		page
	}, testInfo) => {
		const guards = attachErrorGuards(page);

		// 1. Pilih produk & masuk ke checkout
		await page.goto('/katalog');
		const firstProduct = page.locator('a[href^="/produk/"]').first();
		await firstProduct.waitFor({ state: 'visible' });
		const productHref = (await firstProduct.getAttribute('href')) || '/katalog';
		await page.goto(productHref);
		await expect(page).toHaveURL(/\/produk\//);
		await expect(page).toHaveURL(/\/produk\//);

		const tambahBtn = page.getByRole('button', { name: /\+ Keranjang/i });
		await tambahBtn.scrollIntoViewIfNeeded();
		await tambahBtn.click();
		await expect(page.getByText(/Berhasil ditambahkan/i)).toBeVisible();

		await page.goto('/checkout');
		await expect(page.getByText('Data Pemesan')).toBeVisible();

		// 2. Isi data pemesan
		const uniqueName = `Pelanggan E2E ${testInfo.project.name}`;
		await page.locator('input[placeholder="Contoh: Budi Santoso"]').fill(uniqueName);
		await page.locator('input[placeholder="Contoh: 08123456789"]').fill('081234567899');

		// 3. Uji toggle kurir vs ambil di toko
		const kurirBtn = page.getByRole('button', { name: /Kirim Ekspedisi \/ Kurir/i });
		await kurirBtn.scrollIntoViewIfNeeded();
		await kurirBtn.click();
		await expect(page.getByText(/Alamat Lengkap Pengiriman/i)).toBeVisible();

		const ambilBtn = page.getByRole('button', { name: /Ambil Sendiri di Toko/i });
		await ambilBtn.scrollIntoViewIfNeeded();
		await ambilBtn.click();

		// 4. Submit order via QRIS & tangkap orderCode dari API /api/order/create
		const orderRespPromise = page.waitForResponse(
			(res) => res.url().includes('/api/order/create') && res.request().method() === 'POST'
		);
		const bayarBtn = page.getByRole('button', { name: /Bayar QRIS Sekarang/i });
		await bayarBtn.scrollIntoViewIfNeeded();
		await bayarBtn.click();

		const orderResp = await orderRespPromise;
		expect(orderResp.status()).toBe(200);
		const payload = await orderResp.json();
		expect(payload.success).toBe(true);
		expect(payload.orderCode).toMatch(/^FD-/);

		const orderCode: string = payload.orderCode;

		// 5. Pastikan modal QRIS muncul dengan kode order
		await expect(page.getByText(`Order #${orderCode}`)).toBeVisible();
		await expect(page.locator('img[alt="QRIS FD Digital Printing"]')).toBeVisible();

		// 6. Verifikasi halaman sukses pesanan (/pesan/sukses/[code])
		await page.goto(`/pesan/sukses/${orderCode}`);
		await expect(page.getByText(orderCode).first()).toBeVisible();

		// 7. Verifikasi lacak status order (/status-order) dengan kode order nyata
		await page.goto('/status-order');
		await page.locator('input[name="q"]').fill(orderCode);
		await page.getByRole('button', { name: /Lacak Sekarang/i }).click();
		await expect(page).toHaveURL(new RegExp(`/status-order\\?q=${orderCode}`));
		await expect(page.getByText(/1 pesanan ditemukan/i)).toBeVisible();
		await expect(page.getByText(orderCode).first()).toBeVisible();

		guards.assertNoErrors();
	});

	test('lacak pesanan: kode tidak valid menampilkan empty state tidak ditemukan', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/status-order');

		await expect(page.locator('h1')).toContainText(/Lacak Status Pesanan Cetak/i);
		await page.locator('input[name="q"]').fill('FD-INVALID-999999');
		await page.getByRole('button', { name: /Lacak Sekarang/i }).click();

		await expect(page.getByRole('heading', { name: /Pesanan Tidak Ditemukan/i })).toBeVisible();
		await expect(page.getByText(/0 pesanan ditemukan/i)).toBeVisible();

		guards.assertNoErrors();
	});

	test('halaman armada mesin (/mesin) termuat dengan baik tanpa error', async ({ page }) => {
		const guards = attachErrorGuards(page);
		await page.goto('/mesin');

		await expect(page).toHaveTitle(/Mesin Percetakan.*FD Digital Printing/i);
		await expect(page.locator('h1')).toContainText(/Armada Mesin Percetakan Kami/i);
		await expect(page.locator('header').getByText('FD Digital Printing')).toBeVisible();

		guards.assertNoErrors();
	});
});
