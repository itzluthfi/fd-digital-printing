<script lang="ts">
	import {
		ArrowLeft,
		Check,
		CheckCircle2,
		Clock,
		Copy,
		Download,
		ExternalLink,
		PackageCheck,
		Printer,
		QrCode,
		ShieldCheck,
		Wallet
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { saveGuestOrder } from '#lib/guest-orders';
	import { rupiah, tglWaktu, STATUS_LABEL } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const WA_NUMBER = '6289507370805';
	let copied = $state(false);

	onMount(() => {
		if (data.order?.code) {
			saveGuestOrder({
				code: data.order.code,
				name: data.order.description ?? `Pesanan ${data.order.code}`,
				total: data.order.total,
				createdAt: data.order.createdAt ?? new Date().toISOString()
			});
		}
	});

	function salinKode() {
		navigator.clipboard.writeText(data.order.code ?? '');
		copied = true;
		toast.success('Kode order disalin ke clipboard!');
		setTimeout(() => (copied = false), 2500);
	}

	const isPaid = $derived(data.order.status !== 'baru' || (data.payments && data.payments.length > 0));

	const waKonfirmasiUrl = $derived.by(() => {
		const orderUrl = `https://fd-printing.sir-l.web.id/pesan/sukses/${data.order.code}`;
		const statusBayar = isPaid ? 'LUNAS (QRIS)' : 'Menunggu Pembayaran';
		const pesan =
			`Halo FD Digital Printing, saya baru saja melakukan pemesanan via Web!\n\n` +
			`📋 *DETAIL ORDER*\n` +
			`• Kode Order: *${data.order.code}*\n` +
			`• Nama: *${data.order.customerName ?? '-'}* (${data.order.customerPhone ?? '-'})\n` +
			`• Item: ${data.order.description}\n` +
			`• Total Tagihan: *${rupiah(data.order.total)}*\n` +
			`• Status: *${statusBayar}*\n` +
			(data.order.fileUrl ? `• Link File Desain: ${data.order.fileUrl}\n` : '') +
			`\n🔗 *Link Detail & Cek Pesanan (Klik langsung):*\n${orderUrl}\n\n` +
			`Mohon dicek dan diproses ya min. Terima kasih!`;
		return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesan)}`;
	});

	// Status progression step
	const statusMap: Record<string, number> = {
		baru: 1,
		diproses: 2,
		selesai: 3,
		diambil: 4
	};
	const currentStep = $derived(statusMap[data.order.status] ?? 1);

	// Generate & Download Digital Invoice PNG Langsung
	async function unduhInvoice() {
		try {
			toast.info('Menyiapkan dokumen invoice...');
			const canvas = document.createElement('canvas');
			canvas.width = 650;
			canvas.height = 880;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas tidak didukung');

			// 1. Background Putih Bersih
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// 2. Border Luar
			ctx.strokeStyle = '#e2e8f0';
			ctx.lineWidth = 2;
			ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

			// Aksen Biru Atas
			ctx.fillStyle = '#00aeef';
			ctx.fillRect(14, 14, canvas.width - 28, 6);

			// Muat logo jika ada
			try {
				const logoImg = new Image();
				logoImg.crossOrigin = 'anonymous';
				await new Promise<void>((resolve) => {
					logoImg.onload = () => resolve();
					logoImg.onerror = () => resolve();
					logoImg.src = '/logo.png';
				});
				if (logoImg.width > 0) {
					ctx.drawImage(logoImg, 35, 36, 46, 46);
				}
			} catch {
				// Abaikan jika logo gagal muat
			}

			// Header Toko
			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 18px sans-serif';
			ctx.textAlign = 'left';
			ctx.fillText('FD DIGITAL PRINTING', 92, 52);

			ctx.fillStyle = '#64748b';
			ctx.font = '11px sans-serif';
			ctx.fillText('Percetakan Digital, Banner, Brosur & Merchandise', 92, 68);
			ctx.fillText('Jl. Raya Wadungasri No. 42, Sidoarjo • WA: 0895-0737-0805', 92, 83);

			// Header Kanan: INVOICE / NOTA
			ctx.textAlign = 'right';
			ctx.fillStyle = '#0284c7';
			ctx.font = 'bold 20px sans-serif';
			ctx.fillText('INVOICE / NOTA', 615, 52);

			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 13px monospace';
			ctx.fillText(`NO: ${data.order.code}`, 615, 70);

			ctx.fillStyle = '#64748b';
			ctx.font = '11px sans-serif';
			ctx.fillText(tglWaktu(data.order.createdAt), 615, 85);

			// Garis Pemisah Header
			ctx.strokeStyle = '#e2e8f0';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(35, 102);
			ctx.lineTo(615, 102);
			ctx.stroke();

			// Kotak Informasi Pelanggan
			ctx.fillStyle = '#f8fafc';
			ctx.beginPath();
			ctx.roundRect(35, 115, 580, 75, 8);
			ctx.fill();
			ctx.strokeStyle = '#e2e8f0';
			ctx.stroke();

			ctx.textAlign = 'left';
			ctx.fillStyle = '#64748b';
			ctx.font = 'bold 10px sans-serif';
			ctx.fillText('DITUJUKAN KEPADA:', 50, 136);
			ctx.fillText('STATUS ORDER:', 390, 136);

			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 14px sans-serif';
			ctx.fillText(data.order.customerName || 'Pelanggan Walk-in', 50, 156);

			ctx.fillStyle = '#475569';
			ctx.font = '12px sans-serif';
			ctx.fillText(data.order.customerPhone || '-', 50, 173);

			// Badge Status
			const statusLabel = STATUS_LABEL[data.order.status] ?? data.order.status.toUpperCase();
			const isDone = data.order.status === 'selesai' || data.order.status === 'diambil';
			ctx.fillStyle = isDone ? '#059669' : '#0284c7';
			ctx.beginPath();
			ctx.roundRect(390, 145, 130, 24, 6);
			ctx.fill();

			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 11px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(statusLabel.toUpperCase(), 390 + 65, 161);

			// Tabel Rincian Header
			const tableY = 210;
			ctx.fillStyle = '#f1f5f9';
			ctx.beginPath();
			ctx.roundRect(35, tableY, 580, 32, 6);
			ctx.fill();

			ctx.textAlign = 'left';
			ctx.fillStyle = '#475569';
			ctx.font = 'bold 11px sans-serif';
			ctx.fillText('DESKRIPSI ITEM CETAKAN', 50, tableY + 20);

			ctx.textAlign = 'right';
			ctx.fillText('JUMLAH', 595, tableY + 20);

			// Isi Rincian
			let rowY = tableY + 48;
			ctx.textAlign = 'left';
			ctx.fillStyle = '#0f172a';
			ctx.font = '13px sans-serif';

			const rawDesc = data.order.description ?? '';
			const descLines = rawDesc.split('\n');
			for (const l of descLines) {
				const words = l.split(' ');
				let currentLine = '';
				for (const w of words) {
					const testLine = currentLine ? currentLine + ' ' + w : w;
					if (ctx.measureText(testLine).width > 420) {
						ctx.fillText(currentLine, 50, rowY);
						rowY += 20;
						currentLine = w;
					} else {
						currentLine = testLine;
					}
				}
				if (currentLine) {
					ctx.fillText(currentLine, 50, rowY);
					rowY += 20;
				}
			}

			if (data.order.fileUrl) {
				ctx.fillStyle = '#0284c7';
				ctx.font = '11px sans-serif';
				ctx.fillText(`File: ${data.order.fileUrl.slice(0, 55)}${data.order.fileUrl.length > 55 ? '...' : ''}`, 50, rowY);
				rowY += 22;
			}

			// Subtotal nominal
			const subtotal = data.order.subtotal || data.order.total;
			ctx.textAlign = 'right';
			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 13px sans-serif';
			ctx.fillText(rupiah(subtotal), 595, tableY + 48);

			// Divider Subtotal
			const sumY = Math.max(rowY + 15, 360);
			ctx.strokeStyle = '#e2e8f0';
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(35, sumY);
			ctx.lineTo(615, sumY);
			ctx.stroke();

			// Kode unik jika ada
			let curSumY = sumY + 24;
			if (data.order.total > subtotal) {
				ctx.textAlign = 'left';
				ctx.fillStyle = '#64748b';
				ctx.font = '12px sans-serif';
				ctx.fillText('Kode Unik Transaksi QRIS:', 320, curSumY);

				ctx.textAlign = 'right';
				ctx.fillStyle = '#0284c7';
				ctx.font = '12px sans-serif';
				ctx.fillText(`+${rupiah(data.order.total - subtotal)}`, 595, curSumY);
				curSumY += 22;
			}

			// Grand Total Box
			ctx.fillStyle = '#f8fafc';
			ctx.beginPath();
			ctx.roundRect(300, curSumY, 315, 45, 8);
			ctx.fill();
			ctx.strokeStyle = '#e2e8f0';
			ctx.stroke();

			ctx.textAlign = 'left';
			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 13px sans-serif';
			ctx.fillText('TOTAL PEMBAYARAN:', 315, curSumY + 28);

			ctx.textAlign = 'right';
			ctx.fillStyle = '#00aeef';
			ctx.font = 'bold 18px sans-serif';
			ctx.fillText(rupiah(data.order.total), 595, curSumY + 28);

			// Banner Status Pembayaran
			const stampY = curSumY + 65;
			if (isPaid) {
				ctx.fillStyle = '#ecfdf5';
				ctx.beginPath();
				ctx.roundRect(35, stampY, 580, 52, 8);
				ctx.fill();
				ctx.strokeStyle = '#a7f3d0';
				ctx.stroke();

				ctx.textAlign = 'center';
				ctx.fillStyle = '#059669';
				ctx.font = 'bold 15px sans-serif';
				ctx.fillText('✓ PEMBAYARAN LUNAS (TERVERIFIKASI QRIS)', 325, stampY + 24);

				ctx.fillStyle = '#047857';
				ctx.font = '11px sans-serif';
				ctx.fillText('Pesanan telah masuk proses produksi di percetakan FD Digital Printing.', 325, stampY + 41);

				// Stempel LUNAS
				ctx.save();
				ctx.translate(490, 480);
				ctx.rotate(-0.16);
				ctx.strokeStyle = '#059669';
				ctx.lineWidth = 3;
				ctx.strokeRect(-65, -24, 130, 48);
				ctx.fillStyle = '#059669';
				ctx.font = 'bold 20px sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText('LUNAS', 0, 3);
				ctx.font = 'bold 8px sans-serif';
				ctx.fillText('FD DIGITAL PRINTING', 0, 16);
				ctx.restore();
			} else {
				ctx.fillStyle = '#fffbeb';
				ctx.beginPath();
				ctx.roundRect(35, stampY, 580, 52, 8);
				ctx.fill();
				ctx.strokeStyle = '#fde68a';
				ctx.stroke();

				ctx.textAlign = 'center';
				ctx.fillStyle = '#d97706';
				ctx.font = 'bold 14px sans-serif';
				ctx.fillText('⏳ MENUNGGU VERIFIKASI PEMBAYARAN', 325, stampY + 24);

				ctx.fillStyle = '#b45309';
				ctx.font = '11px sans-serif';
				ctx.fillText(`Silakan selesaikan pembayaran tepat ${rupiah(data.order.total)} via QRIS atau konfirmasi WA.`, 325, stampY + 41);
			}

			// Footer Catatan & Ketentuan
			const footY = 740;
			ctx.strokeStyle = '#f1f5f9';
			ctx.beginPath();
			ctx.moveTo(35, footY);
			ctx.lineTo(615, footY);
			ctx.stroke();

			ctx.textAlign = 'center';
			ctx.fillStyle = '#64748b';
			ctx.font = '11px sans-serif';
			ctx.fillText('Terima kasih atas kepercayaan Anda mencetak bersama FD Digital Printing.', 325, footY + 25);
			ctx.fillText('Harap simpan nota digital ini sebagai bukti sah transaksi dan pengambilan cetakan.', 325, footY + 42);

			ctx.fillStyle = '#94a3b8';
			ctx.font = '10px monospace';
			ctx.fillText(`Link pesanan: https://fd-printing.sir-l.web.id/pesan/sukses/${data.order.code}`, 325, footY + 62);
			ctx.fillText('Dicetak otomatis oleh Sistem Order FD Digital Printing', 325, footY + 78);

			// Download File PNG
			const dataUrl = canvas.toDataURL('image/png');
			const a = document.createElement('a');
			a.href = dataUrl;
			a.download = `Invoice-${data.order.code}.png`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			toast.success(`Invoice ${data.order.code} berhasil diunduh ke perangkat Anda!`);
		} catch (err) {
			console.error('Gagal generate invoice:', err);
			toast.error('Gagal mengunduh gambar invoice.');
		}
	}
</script>

<svelte:head>
	<title>Pesanan: {data.order.code} — FD Digital Printing</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#00aeef]/20 transition-colors">
	<!-- Navbar Header -->
	<header class="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
			<a href="/" class="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-xs sm:text-sm font-semibold">
				<ArrowLeft class="h-4 w-4" />
				<span>Beranda</span>
			</a>

			<div class="flex items-center gap-2">
				<img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-lg object-contain bg-white shadow-2xs" />
				<span class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Status Pesanan</span>
			</div>

			<ThemeToggle class="h-8 w-8" />
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
		<!-- Success Announcement Card -->
		<div class="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:bg-slate-900 dark:border-slate-800 text-center">
			{#if isPaid}
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
					<CheckCircle2 class="h-9 w-9" />
				</div>

				<h1 class="mt-4 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
					Pesanan & Pembayaran Diterima!
				</h1>
				<p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
					Terima kasih! Pembayaran Anda telah terkonfirmasi lunas dan pesanan masuk tahap produksi pengerjaan.
				</p>
			{:else}
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
					<Clock class="h-9 w-9" />
				</div>

				<h1 class="mt-4 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
					Pesanan Tercatat (Menunggu Pembayaran)
				</h1>
				<p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
					Pesanan Anda telah tercatat di antrean. Pembayaran belum terverifikasi lunas — silakan selesaikan via QRIS atau kirim bukti via WhatsApp.
				</p>
			{/if}

			<!-- Kode Order Banner -->
			<div class="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-6 py-4">
				<div class="text-left">
					<span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kode Pelacakan Order</span>
					<span class="font-mono text-2xl font-black text-brand-900 dark:text-[#00aeef] tracking-wider">
						{data.order.code}
					</span>
				</div>
				<button
					type="button"
					onclick={salinKode}
					class="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition shadow-2xs cursor-pointer active:scale-95"
				>
					{#if copied}
						<Check class="h-3.5 w-3.5 text-emerald-500" />
						<span>Tersalin!</span>
					{:else}
						<Copy class="h-3.5 w-3.5" />
						<span>Salin Kode</span>
					{/if}
				</button>
			</div>

			<!-- Status Stepper Timeline -->
			<div class="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
				<div class="grid grid-cols-4 gap-2 text-center">
					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 1 ? 'bg-[#00aeef] text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							1
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Diterima
						</span>
					</div>

					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 2 ? 'bg-[#00aeef] text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							2
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Produksi
						</span>
					</div>

					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 3 ? 'bg-[#00aeef] text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							3
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Selesai
						</span>
					</div>

					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 4 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							4
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 4 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Diambil
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Rincian Pesanan Card -->
		<div class="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
			<h2 class="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
				Rincian Pesanan
			</h2>

			<div class="mt-4 space-y-3 text-xs sm:text-sm">
				<div class="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
					<span class="text-slate-500 dark:text-slate-400">Pemesan</span>
					<span class="font-semibold text-slate-900 dark:text-white">{data.order.customerName} ({data.order.customerPhone})</span>
				</div>

				<div class="py-1.5 border-b border-slate-50 dark:border-slate-800/60">
					<span class="block text-slate-500 dark:text-slate-400 mb-1">Item yang Dipesan:</span>
					<p class="font-medium text-slate-900 dark:text-white whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
						{data.order.description}
					</p>
				</div>

				{#if data.order.fileUrl}
					<div class="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
						<span class="text-slate-500 dark:text-slate-400">File Desain</span>
						<a href={data.order.fileUrl} target="_blank" rel="noopener" class="flex items-center gap-1 font-semibold text-[#00aeef] hover:underline">
							<span>Buka Tautan File</span>
							<ExternalLink class="h-3.5 w-3.5" />
						</a>
					</div>
				{/if}

				<div class="flex items-center justify-between pt-2 text-base font-black">
					<span class="text-slate-900 dark:text-white">Total Tagihan</span>
					<span class="text-[#00aeef]">{rupiah(data.order.total)}</span>
				</div>
			</div>
		</div>

		<!-- Action Buttons: WhatsApp Admin & Unduh Invoice -->
		<div class="no-print mt-6 flex flex-col sm:flex-row gap-3">
			<a
				href={waKonfirmasiUrl}
				target="_blank"
				rel="noopener"
				class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 px-6 text-sm font-bold text-white shadow-lg shadow-green-600/25 hover:bg-green-700 transition active:scale-98"
			>
				<WhatsappIcon class="h-5 w-5" />
				<span>Konfirmasi ke Admin via WhatsApp</span>
			</a>

			<button
				type="button"
				onclick={unduhInvoice}
				class="flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 px-6 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-98 shadow-xs cursor-pointer"
			>
				<Download class="h-4 w-4 text-[#00aeef]" />
				<span>Unduh Invoice / Nota</span>
			</button>
		</div>
	</main>
</div>
