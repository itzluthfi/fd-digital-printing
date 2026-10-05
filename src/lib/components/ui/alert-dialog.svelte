<script lang="ts">
	/**
	 * Modal konfirmasi — pengganti SweetAlert.
	 * Selalu dua aksi jelas: Batal / Konfirmasi (destruktif = merah).
	 */
	import Button from './button.svelte';
	import Dialog from './dialog.svelte';

	type Props = {
		open?: boolean;
		title: string;
		description: string;
		confirmLabel?: string;
		destructive?: boolean;
		loading?: boolean;
		children?: import('svelte').Snippet;
		onconfirm?: () => void | Promise<void>;
		oncancel?: () => void;
	};

	let {
		open = $bindable(false),
		title,
		description,
		confirmLabel = 'Ya, lanjutkan',
		destructive = false,
		loading = false,
		onconfirm,
		oncancel
	}: Props = $props();

	function cancel() {
		open = false;
		oncancel?.();
	}

	async function confirm() {
		await onconfirm?.();
	}
</script>

<Dialog bind:open {title} {description} onclose={oncancel}>
	<div class="flex justify-end gap-2 pt-1">
		<Button variant="outline" onclick={cancel} disabled={loading}>Batal</Button>
		<Button variant={destructive ? 'destructive' : 'default'} onclick={confirm} disabled={loading}>
			{loading ? 'Memproses…' : confirmLabel}
		</Button>
	</div>
</Dialog>
