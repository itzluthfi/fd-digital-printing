<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { MessageCircle, QrCode, Trash2, Upload } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let uploading = $state(false);
	let deleting = $state(false);

	function hasil(aksi: string) {
		return () => {
			if (aksi === 'upload') uploading = true;
			else deleting = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				uploading = false;
				deleting = false;
				if (result.type === 'success') {
					toast.success(aksi === 'upload' ? 'Gambar QRIS tersimpan.' : 'Gambar QRIS dihapus.');
					await update();
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal memproses.'));
				}
			};
		};
	}
</script>

<PageHeader title="Pengaturan" description="Pengaturan toko — hanya owner." />

<section class="max-w-xl rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
	<h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900">
		<QrCode class="h-4 w-4 text-brand-700" /> QRIS toko
	</h2>
	<p class="mt-1 text-xs text-slate-500">
		Gambar QRIS statis yang tampil di kasir saat metode bayar QRIS dipilih, dan di halaman invoice.
		Format PNG/JPG, maksimal 2 MB.
	</p>

	{#if data.qrisAda}
		<div class="mt-4 flex flex-col items-center gap-3">
			<img
				src="{data.qrisUrl}?v={Date.now()}"
				alt="QRIS FD Digital Printing"
				class="h-52 w-52 rounded-md border border-slate-200 object-contain"
			/>
			<form method="POST" action="?/hapusQris" use:enhance={hasil('hapus')}>
				<Button type="submit" variant="outline" size="sm" disabled={deleting}>
					<Trash2 class="h-3.5 w-3.5" /> {deleting ? 'Menghapus…' : 'Hapus gambar'}
				</Button>
			</form>
		</div>
	{:else}
		<p class="mt-4 rounded-md bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
			Belum ada gambar QRIS. Unggah di bawah ini.
		</p>
	{/if}

	<form
		method="POST"
		action="?/uploadQris"
		enctype="multipart/form-data"
		use:enhance={hasil('upload')}
		class="mt-4 space-y-3 border-t border-slate-100 pt-4"
	>
		<div>
			<Label for="qris">File gambar</Label>
			<input
				id="qris"
				name="qris"
				type="file"
				accept="image/png,image/jpeg"
				required
				class="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs outline-none transition-colors file:mr-3 file:h-full file:cursor-pointer file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
			/>
		</div>
		<Button type="submit" disabled={uploading} class="min-h-10 w-full sm:w-auto">
			<Upload class="h-4 w-4" /> {uploading ? 'Mengunggah…' : 'Unggah QRIS'}
		</Button>
	</form>
</section>

<section class="mt-6 max-w-xl rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
	<h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900">
		<MessageCircle class="h-4 w-4 text-brand-700" /> WhatsApp
	</h2>
	<p class="mt-1 text-xs text-slate-500">
		Provider: <span class="font-semibold">{data.wa.provider}</span> (env WA_PROVIDER) ·
		Status: {data.wa.detail}
	</p>

	<div class="mt-3 grid grid-cols-3 gap-2 text-center">
		<div class="rounded-md bg-slate-50 px-2 py-2.5">
			<p class="text-lg font-bold text-slate-900">{data.waQueue.queued}</p>
			<p class="text-[11px] text-slate-500">Antrian</p>
		</div>
		<div class="rounded-md bg-slate-50 px-2 py-2.5">
			<p class="text-lg font-bold text-green-700">{data.waQueue.sent}</p>
			<p class="text-[11px] text-slate-500">Terkirim</p>
		</div>
		<div class="rounded-md bg-slate-50 px-2 py-2.5">
			<p class="text-lg font-bold text-red-600">{data.waQueue.failed}</p>
			<p class="text-[11px] text-slate-500">Gagal</p>
		</div>
	</div>

	{#if data.waPairingCode}
		<div class="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
			<p class="text-xs font-semibold text-amber-800">Kode pairing (masukkan di WhatsApp → Perangkat Tertaut):</p>
			<p class="mt-1 font-mono text-2xl font-bold tracking-widest text-amber-900">{data.waPairingCode}</p>
		</div>
	{/if}

	<div class="mt-3 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2.5">
		<div>
			<p class="text-xs font-semibold">Risk score: {data.waRisk}</p>
			<p class="text-[11px] text-slate-500">Kill switch aktif otomatis saat skor ≥ 100.</p>
		</div>
		<form method="POST" action="?/waResetRisk" use:enhance>
			<Button type="submit" variant="outline" size="sm">Reset risk</Button>
		</form>
	</div>

	<form method="POST" action="?/waKillSwitch" use:enhance class="mt-3 flex items-center justify-between">
		<p class="text-xs text-slate-600">Pengiriman WA {data.waKillSwitch ? 'DIHENTIKAN' : 'berjalan'}.</p>
		<input type="hidden" name="aktif" value={data.waKillSwitch ? '0' : '1'} />
		<Button type="submit" variant={data.waKillSwitch ? 'default' : 'destructive'} size="sm">
			{data.waKillSwitch ? 'Nyalakan lagi' : 'Hentikan darurat'}
		</Button>
	</form>

	<p class="mt-3 text-[11px] leading-relaxed text-slate-400">
		Jalur unofficial (Baileys) wajib pakai <strong>nomor cadangan</strong>, bukan nomor utama.
		Warm-up 7 hari, jeda gaussian antar pesan, dan circuit breaker aktif otomatis.
		Untuk kebutuhan kritis, pakai provider <span class="font-mono">cloud</span> (official).
	</p>
</section>
