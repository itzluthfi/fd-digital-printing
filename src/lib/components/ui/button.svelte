<script lang="ts">
	import { cva, type VariantProps } from 'class-variance-authority';
	import { cn } from '#lib/utils';

	const buttonVariants = cva(
		'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
		{
			variants: {
				variant: {
					default: 'bg-brand-900 text-white hover:bg-brand-800',
					accent: 'bg-accent-600 text-white hover:bg-accent-700',
					secondary: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
					outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100',
					ghost: 'text-slate-700 hover:bg-slate-200/70',
					destructive: 'bg-red-600 text-white hover:bg-red-700'
				},
				size: {
					default: 'h-9 px-4 py-2',
					sm: 'h-8 px-3 text-xs',
					lg: 'h-10 px-6',
					icon: 'h-9 w-9'
				}
			},
			defaultVariants: { variant: 'default', size: 'default' }
		}
	);

	type Props = VariantProps<typeof buttonVariants> & {
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		disabled?: boolean;
		class?: string;
		ariaLabel?: string;
		title?: string;
		onclick?: (e: MouseEvent) => void;
		children?: import('svelte').Snippet;
	};

	let { variant, size, type = 'button', href, disabled, class: className, ariaLabel, title, onclick, children }: Props = $props();
</script>

{#if href}
	<a {href} {onclick} aria-label={ariaLabel} {title} class={cn(buttonVariants({ variant, size }), className)}>
		{@render children?.()}
	</a>
{:else}
	<button {type} {disabled} {onclick} aria-label={ariaLabel} {title} class={cn(buttonVariants({ variant, size }), className)}>
		{@render children?.()}
	</button>
{/if}
