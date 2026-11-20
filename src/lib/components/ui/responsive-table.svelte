<script lang="ts" module>
	export type RtColumn = {
		key: string;
		label: string;
		class?: string;
		sortable?: boolean;
	};
</script>

<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { cn } from '#lib/utils';

	let {
		columns,
		rows,
		keyOf,
		cell,
		card,
		empty,
		emptyText = 'Belum ada data.',
		class: className,
		pageSize = 15,
		enablePagination = true,
		selectable = false,
		selectedKeys = [],
		onToggleSelect,
		onToggleSelectAll
	}: {
		columns: RtColumn[];
		rows: T[];
		keyOf: (row: T) => string | number;
		cell: Snippet<[RtColumn, T]>;
		card: Snippet<[T]>;
		empty?: Snippet;
		emptyText?: string;
		class?: string;
		pageSize?: number;
		enablePagination?: boolean;
		selectable?: boolean;
		selectedKeys?: (string | number)[];
		onToggleSelect?: (key: string | number) => void;
		onToggleSelectAll?: () => void;
	} = $props();

	// State internal untuk sorting & pagination
	let currentSortKey = $state<string | null>(null);
	let currentSortDir = $state<'asc' | 'desc'>('asc');
	let currentPage = $state(1);
	let perPage = $derived(pageSize);

	function toggleSort(col: RtColumn) {
		if (col.sortable === false) return;
		if (currentSortKey === col.key) {
			if (currentSortDir === 'asc') {
				currentSortDir = 'desc';
			} else {
				currentSortKey = null;
				currentSortDir = 'asc';
			}
		} else {
			currentSortKey = col.key;
			currentSortDir = 'asc';
		}
		currentPage = 1;
	}

	// Baris yang sudah diurutkan (auto-sort fallback jika properti cocok)
	const sortedRows = $derived.by(() => {
		if (!currentSortKey) return rows;
		const key = currentSortKey;
		const dir = currentSortDir === 'asc' ? 1 : -1;

		return [...rows].sort((a: any, b: any) => {
			let valA = a[key];
			let valB = b[key];

			if (valA === undefined || valA === null) valA = '';
			if (valB === undefined || valB === null) valB = '';

			if (typeof valA === 'number' && typeof valB === 'number') {
				return (valA - valB) * dir;
			}
			return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
		});
	});

	const totalRows = $derived(sortedRows.length);
	const totalPages = $derived(enablePagination && perPage > 0 ? Math.max(1, Math.ceil(totalRows / perPage)) : 1);

	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});

	const pagedRows = $derived.by(() => {
		if (!enablePagination || perPage <= 0) return sortedRows;
		const start = (currentPage - 1) * perPage;
		return sortedRows.slice(start, start + perPage);
	});

	const startIndex = $derived(totalRows === 0 ? 0 : (currentPage - 1) * perPage + 1);
	const endIndex = $derived(Math.min(currentPage * perPage, totalRows));

	const isAllSelected = $derived(
		pagedRows.length > 0 && pagedRows.every((r) => selectedKeys.includes(keyOf(r)))
	);
	const isSomeSelected = $derived(
		!isAllSelected && pagedRows.some((r) => selectedKeys.includes(keyOf(r)))
	);
</script>

{#if rows.length === 0}
	{#if empty}
		{@render empty()}
	{:else}
		<div
			class={cn(
				'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900/60',
				className
			)}
		>
			<p class="text-sm font-medium text-slate-500 dark:text-slate-400">{emptyText}</p>
		</div>
	{/if}
{:else}
	<!-- Desktop: tabel normal -->
	<div
		class={cn(
			'hidden w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs md:block dark:border-slate-800 dark:bg-slate-900',
			className
		)}
	>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="border-b border-slate-200 bg-slate-50/90 text-left dark:border-slate-800 dark:bg-slate-950/70">
					<tr>
						{#if selectable}
							<th class="w-10 px-3 py-3 text-center">
								<input
									type="checkbox"
									checked={isAllSelected}
									indeterminate={isSomeSelected}
									onchange={() => onToggleSelectAll?.()}
									class="h-4 w-4 rounded border-slate-300 text-[#00aeef] focus:ring-[#00aeef] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
									aria-label="Pilih semua baris di halaman ini"
								/>
							</th>
						{/if}
						{#each columns as c (c.key)}
							{@const isSortable = c.sortable !== false}
							{@const isActiveSort = currentSortKey === c.key}
							<th
								class={cn(
									'px-3.5 py-3 text-xs font-semibold tracking-wide text-slate-500 uppercase select-none dark:text-slate-400',
									isSortable && 'cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors',
									c.class
								)}
								onclick={() => isSortable && toggleSort(c)}
							>
								<div class={cn('inline-flex items-center gap-1.5', c.class?.includes('text-right') && 'justify-end')}>
									<span>{c.label}</span>
									{#if isSortable}
										{#if isActiveSort}
											{#if currentSortDir === 'asc'}
												<ArrowUp class="h-3.5 w-3.5 text-[#00aeef]" />
											{:else}
												<ArrowDown class="h-3.5 w-3.5 text-[#00aeef]" />
											{/if}
										{:else}
											<ArrowUpDown class="h-3 w-3 opacity-30 group-hover:opacity-100" />
										{/if}
									{/if}
								</div>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
					{#each pagedRows as row (keyOf(row))}
						{@const isSelected = selectedKeys.includes(keyOf(row))}
						<tr
							class={cn(
								'transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50',
								isSelected && 'bg-sky-50/60 dark:bg-sky-950/30'
							)}
						>
							{#if selectable}
								<td class="w-10 px-3 py-3 text-center">
									<input
										type="checkbox"
										checked={isSelected}
										onchange={() => onToggleSelect?.(keyOf(row))}
										class="h-4 w-4 rounded border-slate-300 text-[#00aeef] focus:ring-[#00aeef] dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
										aria-label="Pilih baris"
									/>
								</td>
							{/if}
							{#each columns as c (c.key)}
								<td class={cn('px-3.5 py-3 align-middle text-slate-800 dark:text-slate-200', c.class)}>
									{@render cell(c, row)}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Footer Pagination (Desktop) -->
		{#if enablePagination && totalRows > perPage}
			<div class="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
				<div class="flex items-center gap-2">
					<span>Menampilkan <strong class="font-semibold text-slate-800 dark:text-slate-200">{startIndex}–{endIndex}</strong> dari <strong class="font-semibold text-slate-800 dark:text-slate-200">{totalRows}</strong> data</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span class="mr-2 text-slate-500">Hal. {currentPage} dari {totalPages}</span>
					<button
						type="button"
						disabled={currentPage <= 1}
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
						class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
						aria-label="Halaman sebelumnya"
					>
						<ChevronLeft class="h-3.5 w-3.5" />
					</button>
					<button
						type="button"
						disabled={currentPage >= totalPages}
						onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
						class="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
						aria-label="Halaman berikutnya"
					>
						<ChevronRight class="h-3.5 w-3.5" />
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Mobile: daftar card -->
	<div class="flex flex-col gap-3 md:hidden">
		{#if selectable && onToggleSelectAll}
			<div class="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
				<label class="flex items-center gap-2 cursor-pointer">
					<input
						type="checkbox"
						checked={isAllSelected}
						indeterminate={isSomeSelected}
						onchange={() => onToggleSelectAll()}
						class="h-4 w-4 rounded border-slate-300 text-[#00aeef] focus:ring-[#00aeef] dark:border-slate-700 dark:bg-slate-800"
					/>
					<span>Pilih Semua di Halaman</span>
				</label>
				{#if selectedKeys.length > 0}
					<span class="font-semibold text-[#00aeef]">{selectedKeys.length} terpilih</span>
				{/if}
			</div>
		{/if}

		{#each pagedRows as row (keyOf(row))}
			{@const isSelected = selectedKeys.includes(keyOf(row))}
			<div
				class={cn(
					'relative rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-colors dark:border-slate-800 dark:bg-slate-900',
					isSelected && 'border-[#00aeef] ring-1 ring-[#00aeef]'
				)}
			>
				{#if selectable}
					<div class="mb-2 flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
						<label class="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
							<input
								type="checkbox"
								checked={isSelected}
								onchange={() => onToggleSelect?.(keyOf(row))}
								class="h-4 w-4 rounded border-slate-300 text-[#00aeef] focus:ring-[#00aeef] dark:border-slate-700 dark:bg-slate-800"
							/>
							<span>Pilih baris ini</span>
						</label>
					</div>
				{/if}
				{@render card(row)}
			</div>
		{/each}

		<!-- Footer Pagination (Mobile) -->
		{#if enablePagination && totalRows > perPage}
			<div class="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
				<span>{startIndex}–{endIndex} dari {totalRows} data</span>
				<div class="flex items-center gap-2">
					<button
						type="button"
						disabled={currentPage <= 1}
						onclick={() => (currentPage = Math.max(1, currentPage - 1))}
						class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
					>
						Sebelumnya
					</button>
					<button
						type="button"
						disabled={currentPage >= totalPages}
						onclick={() => (currentPage = Math.min(totalPages, currentPage + 1))}
						class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
					>
						Selanjutnya
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
