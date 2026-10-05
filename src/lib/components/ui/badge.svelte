<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '#lib/utils';

	const badgeVariants = cva(
		'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
		{
			variants: {
				variant: {
					default: 'bg-slate-200 text-slate-800',
					brand: 'bg-brand-100 text-brand-900',
					success: 'bg-green-100 text-green-800',
					warning: 'bg-yellow-100 text-yellow-800',
					danger: 'bg-red-100 text-red-800',
					outline: 'border border-slate-300 text-slate-700'
				}
			},
			defaultVariants: { variant: 'default' }
		}
	);

	let { variant, class: className, children }: VariantProps<typeof badgeVariants> & { class?: string; children?: import('svelte').Snippet } = $props();
</script>

<span class={cn(badgeVariants({ variant }), className)}>
	{@render children?.()}
</span>
