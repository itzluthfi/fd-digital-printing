<script lang="ts">
	import {
		AlertCircle,
		CheckCircle2,
		Clock,
		Download,
		QrCode,
		RefreshCw,
		ShieldCheck,
		X
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { rupiah } from '#lib/format';
	import { getDynamicQrisImageUrl, QRIS_EXPIRY_SECONDS } from '#lib/qris';

	let {
		open = $bindable(false),
		amount = 0,
		orderCode = '',
		customQrImage = '',
		qrisString = '',
		onConfirm
	}: {
		open: boolean;
		amount: number;
		orderCode?: string;
		customQrImage?: string;
		qrisString?: string;
		onConfirm: () => void;
	} = $props();

	// 15 Menit Countdown Timer
	let timeLeft = $state(QRIS_EXPIRY_SECONDS);
	let isExpired = $derived(timeLeft <= 0);
	let isVerifying = $state(false);
	let isPaidSuccess = $state(false);

	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Reset timer & poller when modal opens
	$effect(() => {
		if (open) {
			timeLeft = QRIS_EXPIRY_SECONDS;
			isPaidSuccess = false;

			// Timer Countdown (1 detik)
			if (timerInterval) clearInterval(timerInterval);
			timerInterval = setInterval(() => {
				if (timeLeft > 0) {
					timeLeft -= 1;
				} else {
					if (timerInterval) clearInterval(timerInterval);
					if (pollInterval) clearInterval(pollInterval);
				}
			}, 1000);

			// Realtime Polling Status Pembayaran jika orderCode tersedia
			if (orderCode) {
				if (pollInterval) clearInterval(pollInterval);
				pollInterval = setInterval(cekStatusPembayaran, 3000);
			}
		} else {
			if (timerInterval) clearInterval(timerInterval);
			if (pollInterval) clearInterval(pollInterval);
		}

		return () => {
			if (timerInterval) clearInterval(timerInterval);
			if (pollInterval) clearInterval(pollInterval);
		};
	});

	async function cekStatusPembayaran() {
		if (!orderCode || isExpired || isPaidSuccess) return;
		try {
			const res = await fetch(`/api/order/status?code=${encodeURIComponent(orderCode)}`);
			if (!res.ok) return;
			const data = await res.json();
			if (data.success && data.isPaid) {
				isPaidSuccess = true;
				if (pollInterval) clearInterval(pollInterval);
				if (timerInterval) clearInterval(timerInterval);
				toast.success('Pembayaran terdeteksi! Mengalihkan ke status order...');
				setTimeout(() => {
					onConfirm();
				}, 1200);
			}
		} catch {
			// abaikan network error polling sementara
		}
	}

	let isCheckingManual = $state(false);

	async function handleKlikSayaSudahBayar() {
		if (isCheckingManual) return;
		isCheckingManual = true;
		try {
			if (!orderCode) {
				toast.error('Kode transaksi tidak ditemukan.');
				return;
			}
			const res = await fetch(`/api/order/status?code=${encodeURIComponent(orderCode)}`);
			const data = await res.json();
			if (data.success && data.isPaid) {
				isPaidSuccess = true;
				if (pollInterval) clearInterval(pollInterval);
				if (timerInterval) clearInterval(timerInterval);
				toast.success('Pembayaran berhasil terverifikasi!');
				setTimeout(() => {
					onConfirm();
				}, 1000);
			} else {
				toast.error('Pembayaran belum masuk di mutasi GoQRIS. Silakan selesaikan pembayaran di aplikasi m-banking atau e-wallet Anda.', {
					duration: 6000
				});
			}
		} catch {
			toast.error('Gagal memverifikasi status pembayaran ke server.');
		} finally {
			isCheckingManual = false;
		}
	}

	function resetQris() {
		timeLeft = QRIS_EXPIRY_SECONDS;
		toast.success('Sesi QRIS diperbarui. Sisa waktu 15 menit.');
		if (timerInterval) clearInterval(timerInterval);
		timerInterval = setInterval(() => {
			if (timeLeft > 0) {
				timeLeft -= 1;
			} else {
				if (timerInterval) clearInterval(timerInterval);
			}
		}, 1000);
		if (orderCode) {
			if (pollInterval) clearInterval(pollInterval);
			pollInterval = setInterval(cekStatusPembayaran, 3000);
		}
	}

	// Format Waktu MM:SS
	const formattedTime = $derived.by(() => {
		const m = Math.floor(timeLeft / 60);
		const s = timeLeft % 60;
		return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	});

	const percentLeft = $derived((timeLeft / QRIS_EXPIRY_SECONDS) * 100);

	// Dynamic QR Code URL (GoQRIS atau Local Generator)
	const qrImageUrl = $derived.by(() => {
		if (customQrImage) return customQrImage;
		if (qrisString) {
			return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(qrisString)}`;
		}
		return getDynamicQrisImageUrl(amount);
	});

	// Download QR Image as clean White Card with Canvas
	async function unduhQris() {
		try {
			toast.info('Menyiapkan gambar kartu QRIS...');
			const res = await fetch(qrImageUrl);
			const blob = await res.blob();
			const objectUrl = URL.createObjectURL(blob);

			const img = new Image();
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('Gagal memuat gambar QR'));
				img.src = objectUrl;
			});

			// Canvas Setup (Width: 500, Height: 680)
			const canvas = document.createElement('canvas');
			canvas.width = 500;
			canvas.height = 680;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas not supported');

			// 1. Background Putih Bersih
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Outer border tipis
			ctx.strokeStyle = '#e2e8f0';
			ctx.lineWidth = 2;
			ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

			// 2. Header: QRIS & Brand
			ctx.fillStyle = '#ea1d24'; // QRIS Red
			ctx.beginPath();
			ctx.roundRect(30, 28, 64, 26, 6);
			ctx.fill();

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 13px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText('QRIS', 62, 45);

			ctx.textAlign = 'left';
			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 15px sans-serif';
			ctx.fillText('FD DIGITAL PRINTING', 106, 46);

			// Garis pemisah header
			ctx.strokeStyle = '#f1f5f9';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(30, 68);
			ctx.lineTo(470, 68);
			ctx.stroke();

			// 3. Section Nominal (Di Atas QR)
			ctx.textAlign = 'center';
			ctx.fillStyle = '#64748b';
			ctx.font = 'bold 11px sans-serif';
			ctx.fillText('TOTAL PEMBAYARAN', 250, 92);

			ctx.fillStyle = '#0284c7'; // Cyan brand color
			ctx.font = 'bold 28px sans-serif';
			ctx.fillText(rupiah(amount), 250, 126);

			if (orderCode) {
				ctx.fillStyle = '#94a3b8';
				ctx.font = '11px monospace';
				ctx.fillText(`KODE ORDER: ${orderCode}`, 250, 146);
			}

			// 4. Gambar QR Code (Tengah)
			// Ukuran QR 300x300 di tengah: x = 100, y = 165
			ctx.drawImage(img, 100, 165, 300, 300);

			// 5. Section Nama Penerima (Di Bawah QR)
			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 16px sans-serif';
			ctx.fillText('LUTHFI SHIDQI HABIBULLOH', 250, 498);

			ctx.fillStyle = '#475569';
			ctx.font = '12px sans-serif';
			ctx.fillText('Digital & Kreatif • NMID: ID1026591157593', 250, 520);

			// Garis pemisah footer
			ctx.strokeStyle = '#f1f5f9';
			ctx.beginPath();
			ctx.moveTo(40, 545);
			ctx.lineTo(460, 545);
			ctx.stroke();

			// 6. Footer Information
			ctx.fillStyle = '#94a3b8';
			ctx.font = '11px sans-serif';
			ctx.fillText('Scan menggunakan BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, dll.', 250, 575);
			ctx.fillText('Pastikan nominal transfer sesuai persis hingga 3 digit terakhir.', 250, 595);

			ctx.fillStyle = '#cbd5e1';
			ctx.font = '10px sans-serif';
			ctx.fillText('https://fd-printing.sir-l.web.id', 250, 630);

			// Unduh Gambar Canvas
			URL.revokeObjectURL(objectUrl);
			const dataUrl = canvas.toDataURL('image/png');
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = `QRIS-${orderCode || 'FD'}-Rp${Math.round(amount)}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			toast.success('Kartu QRIS berhasil diunduh ke galeri!');
		} catch (err) {
			console.error('Error generate QR card:', err);
			window.open(qrImageUrl, '_blank');
		}
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
		<div
			class="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl transition-all"
			role="dialog"
			aria-modal="true"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={() => (open = false)}
				class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
				aria-label="Tutup"
			>
				<X class="h-4 w-4" />
			</button>

			<!-- QRIS Header -->
			<div class="text-center">
				<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[11px] font-bold tracking-wider text-[#00aeef] mb-2 border border-sky-100 dark:border-sky-900">
					<QrCode class="h-3.5 w-3.5" />
					<span>QRIS</span>
				</div>
				<h3 class="text-base font-black text-slate-900 dark:text-white">FD DIGITAL PRINTING</h3>
				<p class="text-xs text-slate-500 dark:text-slate-400">NMID: ID1020021198273 · Semua Bank & E-Wallet</p>
			</div>

			<!-- Countdown Timer Bar -->
			<div class="mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200/80 dark:border-slate-700/80">
				<div class="flex items-center justify-between text-xs font-semibold">
					<span class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
						<Clock class="h-3.5 w-3.5 {timeLeft < 180 ? 'text-rose-500 animate-pulse' : 'text-[#00aeef]'}" />
						<span>{isExpired ? 'Waktu Pembayaran Habis' : 'Sisa Waktu Pembayaran:'}</span>
					</span>
					<span class="font-mono font-bold {timeLeft < 180 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}">
						{formattedTime}
					</span>
				</div>
				<!-- Progress bar -->
				<div class="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
					<div
						class="h-full transition-all duration-1000 rounded-full {timeLeft < 180 ? 'bg-rose-500' : 'bg-[#00aeef]'}"
						style={`width: ${percentLeft}%`}
					></div>
				</div>
			</div>

			<!-- QR Display Box (Putih Bersih dengan Nominal di Atas dan Nama di Bawah) -->
			<div class="relative mt-4 flex flex-col items-center justify-center rounded-2xl bg-white p-4 border border-slate-200 shadow-xs overflow-hidden text-slate-900">
				<!-- Nominal pas di atas QR code -->
				<div class="w-full text-center pb-2 mb-2 border-b border-slate-100">
					<span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Tagihan</span>
					<span class="text-2xl font-black text-slate-900 tracking-tight block">{rupiah(amount)}</span>
					{#if orderCode}
						<span class="inline-block mt-0.5 text-[10px] font-mono text-slate-400">Order #{orderCode}</span>
					{/if}
				</div>

				<!-- Gambar QR Code -->
				<div class="p-1 bg-white rounded-xl">
					<img
						src={qrImageUrl}
						alt="QRIS FD Digital Printing"
						class="w-48 h-48 object-contain rounded-lg transition-all duration-300 {isExpired ? 'blur-xs opacity-20' : ''}"
					/>
				</div>

				<!-- Nama Penerima pas di bawah QR code -->
				<div class="w-full text-center pt-2 mt-2 border-t border-slate-100">
					<div class="text-xs font-bold text-slate-900">LUTHFI SHIDQI HABIBULLOH</div>
					<div class="text-[10px] text-slate-500">Digital & Kreatif · NMID: ID1026591157593</div>
				</div>

				<!-- Overlay Expired -->
				{#if isExpired}
					<div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 text-center">
						<AlertCircle class="h-10 w-10 text-rose-500 mb-2" />
						<h4 class="text-sm font-bold text-white">QRIS Kadaluarsa</h4>
						<p class="text-[11px] text-slate-300 mt-1 max-w-[200px]">
							Demi keamanan transaksi, sesi pembayaran ini telah berakhir.
						</p>
						<button
							type="button"
							onclick={resetQris}
							class="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white px-3.5 py-2 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
						>
							<RefreshCw class="h-3.5 w-3.5" />
							<span>Perbarui QRIS Baru</span>
						</button>
					</div>
				{/if}

				<!-- Tombol Download QR -->
				{#if !isExpired}
					<button
						type="button"
						onclick={unduhQris}
						class="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition active:scale-95 cursor-pointer shadow-2xs"
					>
						<Download class="h-3.5 w-3.5 text-[#00aeef]" />
						<span>Unduh Kartu QR Code</span>
					</button>
				{/if}
			</div>

			<!-- Actions -->
			<div class="mt-5 space-y-2">
				{#if isPaidSuccess}
					<div class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white py-3 px-4 font-bold text-sm shadow-md animate-fade-in">
						<CheckCircle2 class="h-5 w-5 animate-bounce" />
						<span>Pembayaran Diterima! Mengalihkan...</span>
					</div>
				{:else if isExpired}
					<button
						type="button"
						onclick={resetQris}
						class="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-3 px-4 font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
					>
						<RefreshCw class="h-4 w-4" />
						<span>Perbarui QRIS Baru</span>
					</button>
				{:else}
					<button
						type="button"
						onclick={handleKlikSayaSudahBayar}
						disabled={isCheckingManual || isExpired}
						class="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-3 px-4 font-bold text-sm shadow-md transition active:scale-95 cursor-pointer disabled:opacity-60"
					>
						{#if isCheckingManual}
							<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							<span>Memeriksa Mutasi GoQRIS...</span>
						{:else}
							<CheckCircle2 class="h-4 w-4" />
							<span>Saya Sudah Bayar</span>
						{/if}
					</button>
				{/if}

				<button
					type="button"
					onclick={() => (open = false)}
					class="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.animate-fade-in {
		animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
</style>
