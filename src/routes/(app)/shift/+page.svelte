<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah, tglWaktu } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let busy = $state(false);

	const cols: RtColumn[] = [
		{ key: 'waktu', label: 'Shift' },
		{ key: 'cash', label: 'Cash', class: 'text-right' },
		{ key: 'selisih', label: 'Selisih', class: 'text-right' }
	];

	function hasil() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			busy = false;
			if (result.type === 'success') {
				if (typeof result.data?.selisih === 'number') {
					const s = result.data.selisih;
					toast[s === 0 ? 'success' : 'warning'](
						s === 0 ? 'Shift ditutup — cash pas.' : `Shift ditutup — selisih ${rupiah(s)}.`
					);
				} else toast.success('Shift dibuka.');
				await update();
			} else if (result.type === 'failure') {
				toast.error(String(result.data?.message ?? 'Gagal memproses.'));
			}
		};
	}

	const expectedAktif = $derived(
		data.aktif ? data.aktif.cashAwal + data.cashMasukBerjalan : 0
	);
</script>

<PageHeader title="Tutup Kasir" description="Rekap shift: buka dengan cash awal, tutup dengan cash fisik." />

{#if data.aktif}
	<section class="mb-6 max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-4">
		<p class="text-sm font-semibold text-amber-900">Shift sedang berjalan</p>
		<p class="mt-1 text-xs text-amber-700">Dibuka {tglWaktu(data.aktif.dibukaAt)}{data.aktif.dibukaOleh ? ` oleh ${data.aktif.dibukaOleh}` : ''}</p>
		<div class="mt-3 space-y-1 text-sm">
			<div class="flex justify-between"><span class="text-slate-500">Cash awal laci</span><span class="font-medium">{rupiah(data.aktif.cashAwal)}</span></div>
			<div class="flex justify-between"><span class="text-slate-500">Cash masuk (tercatat)</span><span class="font-medium">{rupiah(data.cashMasukBerjalan)}</span></div>
			<div class="flex justify-between border-t border-amber-200 pt-1"><span class="text-slate-500">Seharusnya ada</span><span class="font-bold">{rupiah(expectedAktif)}</span></div>
		</div>
		<form
			method="POST"
			action="?/tutup"
			use:enhance={() => {
				busy = true;
				return hasil();
			}}
			class="mt-4 space-y-3 border-t border-amber-200 pt-4"
		>
			<input type="hidden" name="id" value={data.aktif.id} />
			<div>
				<Label for="cashFisik">Cash fisik di laci (Rp)</Label>
				<Input id="cashFisik" name="cashFisik" type="number" min="0" step="500" placeholder="0" required />
			</div>
			<div>
				<Label for="catatan">Catatan</Label>
				<Input id="catatan" name="catatan" placeholder="opsional" />
			</div>
			<Button type="submit" disabled={busy} class="min-h-10 w-full sm:w-auto">
				{busy ? 'Menutup…' : 'Tutup shift'}
			</Button>
		</form>
	</section>
{:else}
	<form
		method="POST"
		action="?/buka"
		use:enhance={() => {
			busy = true;
			return hasil();
		}}
		class="mb-6 max-w-xl rounded-lg border border-slate-200 bg-white p-4"
	>
		<div>
			<Label for="cashAwal">Cash awal di laci (Rp)</Label>
			<Input id="cashAwal" name="cashAwal" type="number" min="0" step="500" placeholder="0" required />
			<p class="mt-1 text-[11px] text-slate-400">Hitung uang cash di laci sebelum mulai jaga.</p>
		</div>
		<Button type="submit" disabled={busy} class="mt-3 min-h-10 w-full sm:w-auto">
			{busy ? 'Membuka…' : 'Buka shift'}
		</Button>
	</form>
{/if}

<h2 class="mb-2 text-sm font-semibold text-slate-900">Riwayat shift</h2>
{#if data.riwayat.length === 0}
	<EmptyState message="Belum ada shift yang ditutup." actionLabel="Muat ulang" actionHref="/shift" />
{:else}
	<ResponsiveTable columns={cols} rows={data.riwayat} keyOf={(s) => s.id}>
		{#snippet cell(c, s)}
			{#if c.key === 'waktu'}
				<span class="font-medium whitespace-nowrap">{tglWaktu(s.dibukaAt)}</span>
				<span class="block text-xs text-slate-400">
					s/d {s.ditutupAt ? tglWaktu(s.ditutupAt) : '-'}{s.ditutupOleh ? ` • ${s.ditutupOleh}` : ''}
				</span>
			{:else if c.key === 'cash'}
				<span class="block text-xs text-slate-500">Awal {rupiah(s.cashAwal ?? 0)} + masuk {rupiah(s.cashMasuk ?? 0)}</span>
				<span class="font-semibold">Fisik {rupiah(s.cashFisik ?? 0)}</span>
			{:else if c.key === 'selisih'}
				<span class={(s.selisih ?? 0) === 0 ? 'font-bold text-green-700' : 'font-bold text-red-600'}>
					{rupiah(s.selisih ?? 0)}
				</span>
			{/if}
		{/snippet}
		{#snippet card(s)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-medium text-sm whitespace-nowrap">{tglWaktu(s.dibukaAt)}</p>
					<p class="text-xs text-slate-400">s/d {s.ditutupAt ? tglWaktu(s.ditutupAt) : '-'}</p>
				</div>
				<span class={(s.selisih ?? 0) === 0 ? 'font-bold text-green-700' : 'font-bold text-red-600'}>
					{rupiah(s.selisih ?? 0)}
				</span>
			</div>
			<p class="mt-1 text-xs text-slate-500">
				Awal {rupiah(s.cashAwal ?? 0)} + masuk {rupiah(s.cashMasuk ?? 0)} = fisik {rupiah(s.cashFisik ?? 0)}
			</p>
		{/snippet}
	</ResponsiveTable>
{/if}
