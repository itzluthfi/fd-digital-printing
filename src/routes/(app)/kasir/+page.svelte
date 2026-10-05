<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { LoaderCircle, Mic, ScanLine, Tags } from 'lucide-svelte';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import Select from '#lib/components/ui/select.svelte';
	import Textarea from '#lib/components/ui/textarea.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { cn } from '#lib/utils';
	import { rupiah, tglWaktu, METODE_LABEL } from '#lib/format';
	import { hitungKatalog } from '#lib/katalog';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let pelangganId = $state(data.customers[0]?.id ? String(data.customers[0].id) : 'baru');
	let method = $state('cash');
	let description = $state('');
	let namaBaru = $state('');
	let total = $state<number | undefined>(undefined);
	let dibayar = $state<number | undefined>(undefined);
	let dibayarManual = $state(false);
	let discountType = $state<'rp' | 'pct'>('rp');
	let discountValue = $state<number | undefined>(undefined);
	let saving = $state(false);

	function onMethodChange() {
		// Ganti metode → reset default: piutang = 0, lainnya = total bayar
		dibayar = method === 'piutang' ? 0 : grandTotal || undefined;
		dibayarManual = false;
	}

	function onTotalInput() {
		// Ikuti total otomatis selama user belum ketik manual (kecuali piutang)
		if (!dibayarManual && method !== 'piutang') dibayar = grandTotal || undefined;
	}

	const discountRp = $derived.by(() => {
		const sub = total ?? 0;
		const v = discountValue ?? 0;
		if (v <= 0 || sub <= 0) return 0;
		const r = discountType === 'pct' ? Math.round((sub * Math.min(v, 100)) / 100) : Math.round(v);
		return Math.min(r, sub);
	});
	const grandTotal = $derived(Math.max(0, (total ?? 0) - discountRp));
	const sisa = $derived(grandTotal - (dibayar ?? 0));
	const kembalian = $derived(method === 'cash' ? Math.max(0, (dibayar ?? 0) - grandTotal) : 0);
	const isBaru = $derived(pelangganId === 'baru');

	/* ---- Katalog harga: hitung otomatis (reseller + min charge) ---- */
	let katalogId = $state('');
	let panjang = $state<number | undefined>(undefined);
	let lebar = $state<number | undefined>(undefined);
	let qty = $state<number | undefined>(undefined);
	let pakaiReseller = $state(false);

	const katalogItem = $derived(data.katalog.find((k) => String(k.id) === katalogId));
	const hasilKatalog = $derived.by(() =>
		katalogItem
			? hitungKatalog(katalogItem, { panjang, lebar, qty }, pakaiReseller)
			: null
	);
	const hitungKatalogTotal = $derived(hasilKatalog?.total ?? 0);
	const rumusKatalog = $derived(hasilKatalog?.rumus ?? '');

	function terapkanKatalog() {
		const it = katalogItem;
		const h = hasilKatalog;
		if (!it || !h || h.total <= 0) return;
		const dimensi = it.unit === 'meter' ? `${panjang}x${lebar} m` : `${qty} ${it.unit}`;
		description = `${it.name} ${dimensi} (${h.rumus})`;
		total = h.total;
		onTotalInput();
		toast.success(
			h.pakaiReseller ? 'Harga reseller dari katalog diterapkan.' : 'Harga dari katalog diterapkan.'
		);
	}

	/* ---- AI kasir: isi via suara & scan struk ---- */
	let listening = $state(false);
	let aiBusy = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let recognition: { stop(): void } | null = null;

	type AiHasil = { description: string; total: number; customer_name?: string | null };

	function applyAi(r: AiHasil) {
		if (r.description) description = r.description;
		if (r.total > 0) {
			total = r.total;
			onTotalInput();
		}
		if (r.customer_name) {
			const nama = r.customer_name.toLowerCase();
			const cocok = data.customers.find(
				(c) => c.name.toLowerCase().includes(nama) || nama.includes(c.name.toLowerCase())
			);
			if (cocok) pelangganId = String(cocok.id);
			else {
				pelangganId = 'baru';
				namaBaru = r.customer_name;
			}
		}
	}

	async function kirimParse(transcript: string) {
		aiBusy = true;
		try {
			const res = await fetch('/api/ai/parse', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ transcript })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'AI gagal memahami.');
			applyAi(data);
			toast.success('Form terisi dari suara.');
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Gagal memproses suara.');
		} finally {
			aiBusy = false;
		}
	}

	function startVoice() {
		const SR =
			(window as unknown as Record<string, unknown>).SpeechRecognition ??
			(window as unknown as Record<string, unknown>).webkitSpeechRecognition;
		if (!SR || typeof SR !== 'function') {
			toast.error('Browser tidak mendukung input suara.');
			return;
		}
		try {
			recognition?.stop();
		} catch {
			/* abaikan */
		}
		const rec = new (SR as new () => any)();
		recognition = rec;
		rec.lang = 'id-ID';
		rec.interimResults = false;
		rec.maxAlternatives = 1;
		rec.onresult = (e: { results: { transcript: string }[][] }) => {
			const teks = e.results[0]?.[0]?.transcript ?? '';
			listening = false;
			if (teks.trim()) kirimParse(teks);
		};
		rec.onerror = () => {
			listening = false;
			toast.error('Gagal mendengar. Coba lagi.');
		};
		rec.onend = () => {
			listening = false;
		};
		rec.start();
		listening = true;
		toast.info('Mendengarkan… sebutkan pesanan & total.');
	}

	function blobToB64(blob: Blob): Promise<string> {
		return new Promise((resolve, reject) => {
			const fr = new FileReader();
			fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '');
			fr.onerror = reject;
			fr.readAsDataURL(blob);
		});
	}

	async function onScanFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (fileInput) fileInput.value = '';
		if (!file) return;
		aiBusy = true;
		try {
			const bmp = await createImageBitmap(file);
			const skala = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(bmp.width * skala));
			canvas.height = Math.max(1, Math.round(bmp.height * skala));
			canvas.getContext('2d')?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
			const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
			if (!blob) throw new Error('Gagal memproses gambar.');
			const b64 = await blobToB64(blob);
			const res = await fetch('/api/ai/scan', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ image: b64, mime: 'image/jpeg' })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? 'AI gagal membaca struk.');
			applyAi(data);
			toast.success(
				data.items?.length ? `Struk terbaca (${data.items.length} item).` : 'Struk terbaca, form terisi.'
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Gagal memindai struk.');
		} finally {
			aiBusy = false;
		}
	}

	/* ---- Riwayat transaksi ---- */
	let q = $state('');
	let metodeFilter = $state('semua');

	const metodeVariant: Record<string, 'default' | 'brand' | 'success' | 'warning'> = {
		cash: 'success',
		transfer: 'brand',
		qris: 'warning',
		piutang: 'default'
	};
	const metodeChips = [
		{ key: 'semua', label: 'Semua metode' },
		...Object.entries(METODE_LABEL).map(([key, label]) => ({ key, label }))
	];
	const tampil = $derived(
		data.riwayat
			.filter((r) => metodeFilter === 'semua' || r.method === metodeFilter)
			.filter((r) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					(r.description ?? '').toLowerCase().includes(s) ||
					(r.customerName ?? '').toLowerCase().includes(s) ||
					(r.orderId != null && String(r.orderId).includes(s))
				);
			})
	);
	const cols: RtColumn[] = [
		{ key: 'waktu', label: 'Waktu' },
		{ key: 'order', label: 'Order' },
		{ key: 'pelanggan', label: 'Pelanggan' },
		{ key: 'metode', label: 'Metode' },
		{ key: 'jumlah', label: 'Jumlah', class: 'text-right' }
	];
</script>

<PageHeader title="Kasir" description="Catat transaksi baru — cepat, satu layar." />

<div class="mb-3 flex max-w-xl gap-2">
	<Button
		type="button"
		variant="outline"
		size="sm"
		class="min-h-10 flex-1"
		onclick={startVoice}
		disabled={aiBusy}
	>
		{#if listening}
			<span class="relative flex h-4 w-4">
				<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
				<span class="relative inline-flex h-4 w-4 rounded-full bg-red-500"></span>
			</span>
			Mendengarkan…
		{:else}
			<Mic /> Isi via suara
		{/if}
	</Button>
	<Button
		type="button"
		variant="outline"
		size="sm"
		class="min-h-10 flex-1"
		onclick={() => fileInput?.click()}
		disabled={aiBusy || listening}
	>
		{#if aiBusy && !listening}
			<LoaderCircle class="animate-spin" /> Memproses…
		{:else}
			<ScanLine /> Scan struk
		{/if}
	</Button>
	<input
		type="file"
		accept="image/*"
		capture="environment"
		class="hidden"
		bind:this={fileInput}
		onchange={onScanFile}
		aria-label="Foto struk"
	/>
</div>

{#if data.katalog.length > 0}
	<div class="mb-3 max-w-xl rounded-lg border border-slate-200 bg-white p-3">
		<p class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
			<Tags class="h-4 w-4" /> Dari katalog harga
		</p>
		<div class="grid gap-2 sm:grid-cols-2">
			<Select bind:value={katalogId}>
				<option value="">— Pilih item —</option>
				{#each data.katalog as k (k.id)}
					<option value={String(k.id)}>{k.name} — {rupiah(k.price)}/{k.unit}</option>
				{/each}
			</Select>
			{#if katalogItem?.unit === 'meter'}
				<div class="grid grid-cols-2 gap-2">
					<Input type="number" min="0" step="0.1" bind:value={panjang} placeholder="Panjang (m)" />
					<Input type="number" min="0" step="0.1" bind:value={lebar} placeholder="Lebar (m)" />
				</div>
			{:else if katalogItem}
				<Input type="number" min="0" step="1" bind:value={qty} placeholder="Jumlah ({katalogItem.unit})" />
			{/if}
		</div>
		{#if katalogItem?.resellerPrice != null}
			<label class="mt-2 flex items-center gap-2 text-xs text-slate-600">
				<input type="checkbox" bind:checked={pakaiReseller} class="h-3.5 w-3.5 rounded" />
				Pakai harga reseller ({rupiah(katalogItem.resellerPrice)})
			</label>
		{/if}
		{#if hitungKatalogTotal > 0}
			<div class="mt-2 flex items-center justify-between gap-2">
				<span class="text-xs text-slate-500">{rumusKatalog}</span>
				<Button type="button" size="sm" onclick={terapkanKatalog}
					>Pakai {rupiah(hitungKatalogTotal)}</Button
				>
			</div>
		{/if}
	</div>
{/if}

<form
	method="POST"
	class="max-w-xl rounded-lg border border-slate-200 bg-white p-4 sm:p-5"
	use:enhance={() => {
		saving = true;
		return async ({ result, update }) => {
			if (result.type === 'redirect') {
				toast.success('Transaksi tersimpan.');
				await update();
			} else if (result.type === 'failure') {
				saving = false;
				toast.error((result.data?.message as string) ?? 'Gagal menyimpan transaksi.');
			} else {
				saving = false;
			}
		};
	}}
>
	<div class="space-y-4">
		<div>
			<Label for="pelanggan">Pelanggan</Label>
			<Select id="pelanggan" name="pelangganId" bind:value={pelangganId}>
				<option value="baru">Walk-in / pelanggan baru</option>
				{#each data.customers as c (c.id)}
					<option value={String(c.id)}>{c.name} — {c.phone}</option>
				{/each}
			</Select>
		</div>

		{#if isBaru}
			<div class="grid gap-4 rounded-md bg-slate-50 p-3 sm:grid-cols-2">
				<div>
					<Label for="namaBaru">Nama</Label>
					<Input id="namaBaru" name="namaBaru" placeholder="Nama pelanggan" required bind:value={namaBaru} />
				</div>
				<div>
					<Label for="teleponBaru">Telepon</Label>
					<Input id="teleponBaru" name="teleponBaru" placeholder="08…" required />
				</div>
			</div>
		{/if}

		<div>
			<Label for="description">Deskripsi cetakan</Label>
			<Textarea
				id="description"
				name="description"
				rows={2}
				placeholder="cth: Cetak banner 3x2 m, 2 pcs"
				required
				bind:value={description}
			/>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<Label for="total">Subtotal (Rp)</Label>
				<Input
					id="total"
					name="total"
					type="number"
					min="0"
					step="500"
					placeholder="0"
					required
					bind:value={total}
					oninput={onTotalInput}
				/>
			</div>
			<div>
				<Label for="method">Metode bayar</Label>
				<Select
					id="method"
					name="method"
					bind:value={method}
					onchange={onMethodChange}
				>
					{#each Object.entries(METODE_LABEL) as [key, label] (key)}
						<option value={key}>{label}</option>
					{/each}
				</Select>
			</div>
		</div>

		{#if method === 'qris'}
			{#if data.qrisUrl}
				<div class="flex flex-col items-center gap-2 rounded-md border border-slate-200 bg-white p-4">
					<img src={data.qrisUrl} alt="QRIS FD Digital Printing" class="h-48 w-48 object-contain" />
					<p class="text-xs text-slate-500">
						Scan QRIS untuk membayar{grandTotal ? ` ${rupiah(grandTotal)}` : ''}
					</p>
				</div>
			{:else}
				<p class="rounded-md bg-yellow-50 px-3 py-2.5 text-xs text-yellow-800">
					Gambar QRIS belum diunggah — minta owner mengunggahnya di halaman Pengaturan.
				</p>
			{/if}
		{/if}

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<Label for="discountValue">Diskon</Label>
				<Input
					id="discountValue"
					name="discountValue"
					type="number"
					min="0"
					max={discountType === 'pct' ? 100 : undefined}
					step={discountType === 'pct' ? 1 : 500}
					placeholder="0"
					bind:value={discountValue}
				/>
			</div>
			<div>
				<Label for="discountType">Jenis diskon</Label>
				<Select id="discountType" name="discountType" bind:value={discountType}>
					<option value="rp">Rupiah (Rp)</option>
					<option value="pct">Persen (%)</option>
				</Select>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<Label for="janjiSelesai">Janji selesai</Label>
				<Input id="janjiSelesai" name="janjiSelesai" type="date" />
				<p class="mt-1 text-[11px] text-slate-400">Tanggal pengerjaan dijanjikan selesai.</p>
			</div>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<Label for="dibayar">Dibayar sekarang (Rp)</Label>
				<Input
					id="dibayar"
					name="dibayar"
					type="number"
					min="0"
					max={method === 'cash' ? undefined : grandTotal}
					step="500"
					bind:value={dibayar}
					oninput={() => (dibayarManual = true)}
				/>
				{#if method === 'cash' && kembalian > 0}
					<p class="mt-1 text-xs font-semibold text-green-700">Kembalian: {rupiah(kembalian)}</p>
				{/if}
			</div>
			{#if sisa > 0}
				<div>
					<Label for="dueDate">Jatuh tempo sisa</Label>
					<Input id="dueDate" name="dueDate" type="date" value={data.defaultDueDate} />
				</div>
			{/if}
		</div>

		<div class="space-y-1 rounded-md bg-slate-50 px-3 py-2.5 text-sm">
			<div class="flex items-center justify-between">
				<span class="text-slate-500">Subtotal</span>
				<span class="font-medium text-slate-700">{rupiah(total ?? 0)}</span>
			</div>
			{#if discountRp > 0}
				<div class="flex items-center justify-between">
					<span class="text-slate-500">Diskon{discountType === 'pct' ? ` (${discountValue ?? 0}%)` : ''}</span>
					<span class="font-medium text-red-600">−{rupiah(discountRp)}</span>
				</div>
			{/if}
			<div class="flex items-center justify-between border-t border-slate-200 pt-1">
				<span class="text-slate-500">Total bayar</span>
				<span class="font-bold text-slate-900">{rupiah(grandTotal)}</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-slate-500">Sisa yang belum dibayar</span>
				<span class={sisa > 0 ? 'font-bold text-yellow-700' : 'font-bold text-green-700'}>
					{rupiah(Math.max(0, sisa))}
				</span>
			</div>
		</div>

		<div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
			<Button type="button" variant="outline" class="min-h-10 w-full sm:w-auto" onclick={() => goto('/dashboard')}>Batal</Button>
			<Button type="submit" class="min-h-10 w-full sm:w-auto" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan transaksi'}</Button>
		</div>
	</div>
</form>

<section class="mt-8 max-w-xl">
	<h2 class="mb-3 text-sm font-semibold text-slate-900">Transaksi terakhir</h2>
	<div class="mb-3 space-y-2">
		<SearchInput bind:value={q} placeholder="Cari deskripsi, pelanggan, kode order…" />
		<div class="flex flex-wrap gap-2">
			{#each metodeChips as m (m.key)}
				<button
					type="button"
					onclick={() => (metodeFilter = m.key)}
					class={cn(
						'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
						metodeFilter === m.key
							? 'border-brand-900 bg-brand-900 text-white'
							: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
					)}
				>
					{m.label}
				</button>
			{/each}
		</div>
	</div>
	<ResponsiveTable columns={cols} rows={tampil} keyOf={(r) => r.id} emptyText="Belum ada transaksi yang cocok.">
		{#snippet cell(c, r)}
			{#if c.key === 'waktu'}
				<span class="whitespace-nowrap">{tglWaktu(r.paidAt)}</span>
			{:else if c.key === 'order'}
				{#if r.orderId}
					<a href="/kasir/invoice/{r.orderId}" class="font-medium text-brand-700 hover:underline">#{r.orderId}</a>
					<span class="text-slate-500"> — {r.description ?? ''}</span>
				{:else}
					<span class="text-slate-400">-</span>
				{/if}
			{:else if c.key === 'pelanggan'}
				{r.customerName ?? '-'}
			{:else if c.key === 'metode'}
				<Badge variant={metodeVariant[r.method] ?? 'default'}>{METODE_LABEL[r.method] ?? r.method}</Badge>
			{:else if c.key === 'jumlah'}
				<span class="font-medium">{rupiah(r.amount)}</span>
			{/if}
		{/snippet}
		{#snippet card(r)}
			<div class="flex items-start justify-between gap-2">
				<p class="font-semibold text-slate-900">
					{#if r.orderId}
						<a href="/kasir/invoice/{r.orderId}" class="text-brand-700 hover:underline">#{r.orderId}</a>
						<span class="font-normal text-slate-500"> — {r.description ?? ''}</span>
					{:else}
						<span class="text-slate-400">-</span>
					{/if}
				</p>
				<Badge variant={metodeVariant[r.method] ?? 'default'}>{METODE_LABEL[r.method] ?? r.method}</Badge>
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<p><span class="text-slate-400">Pelanggan: </span><span class="text-slate-700">{r.customerName ?? '-'}</span></p>
				<p><span class="text-slate-400">Waktu: </span><span class="text-slate-700">{tglWaktu(r.paidAt)}</span></p>
			</div>
			<p class="mt-2 text-right text-base font-bold text-slate-900">{rupiah(r.amount)}</p>
		{/snippet}
	</ResponsiveTable>
</section>
