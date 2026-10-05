<script lang="ts" module>
	export type RtColumn = { key: string; label: string; class?: string };
</script>

<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils';

	let {
		columns,
		rows,
		keyOf,
		cell,
		card,
		empty,
		emptyText = 'Belum ada data.',
		class: className
	}: {
		columns: RtColumn[];
		rows: T[];
		keyOf: (row: T) => string | number;
		cell: Snippet<[RtColumn, T]>;
		card: Snippet<[T]>;
		empty?: Snippet;
		emptyText?: string;
		class?: string;
	} = $props();
</script>

{#if rows.length === 0}
	{#if empty}
		{@render empty()}
	{:else}
		<div
			class={cn(
				'flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white py-10 text-center',
				className
			)}
		>
			<p class="text-sm text-slate-500">{emptyText}</p>
		</div>
	{/if}
{:else}
	<!-- Desktop: tabel normal -->
	<div
		class={cn(
			'hidden w-full overflow-x-auto rounded-lg border border-slate-200 bg-white md:block',
			className
		)}
	>
		<table class="w-full text-sm">
			<thead class="border-b border-slate-200 bg-slate-50 text-left">
				<tr>
					{#each columns as c (c.key)}
						<th
							class={cn(
								'px-3 py-2.5 text-xs font-semibold tracking-wide text-slate-500 uppercase',
								c.class
							)}
						>
							{c.label}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody class="[&_tr]:border-b [&_tr]:border-slate-100 [&_tr:last-child]:border-0 [&_tr:hover]:bg-slate-50/70">
				{#each rows as row (keyOf(row))}
					<tr>
						{#each columns as c (c.key)}
							<td class={cn('px-3 py-2.5 align-middle text-slate-800', c.class)}>
								{@render cell(c, row)}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Mobile: daftar card -->
	<div class="flex flex-col gap-3 md:hidden">
		{#each rows as row (keyOf(row))}
			<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
				{@render card(row)}
			</div>
		{/each}
	</div>
{/if}
