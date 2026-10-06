<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-4 font-sans text-slate-900 dark:text-slate-100 transition-colors">
	<!-- Top Bar Navigasi: Beranda & Theme Toggle -->
	<div class="w-full max-w-sm md:max-w-2xl lg:max-w-3xl flex items-center justify-between mb-2.5">
		<a
			href="/"
			class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
		>
			<ArrowLeft class="h-3.5 w-3.5" />
			<span>Beranda</span>
		</a>
		<ThemeToggle class="h-8 w-8" />
	</div>

	<!-- Main Auth Card Compact: Foto di Kiri (Desktop/Tablet) + Form di Kanan (Zero-scroll, clean & modern) -->
	<div class="w-full max-w-sm md:max-w-2xl lg:max-w-3xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xl grid md:grid-cols-12 md:h-[480px] transition-all">
		<!-- Kolom Kiri: Foto Percetakan Estetik (Hanya Desktop/Tablet, tersembunyi di Mobile) -->
		<div class="relative hidden md:flex md:col-span-5 flex-col justify-between overflow-hidden bg-slate-950 p-5 text-white select-none">
			<img
				src="/banner-avatar.png"
				alt="FD Digital Printing"
				class="absolute inset-0 h-full w-full object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20"></div>

			<!-- Brand Logo di Atas Foto -->
			<div class="relative z-10 flex items-center gap-2">
				<img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-lg bg-white p-0.5 shadow-md object-contain" />
				<div>
					<span class="block text-xs font-black tracking-tight text-white leading-none">FD DIGITAL PRINTING</span>
					<span class="block text-[9px] text-slate-300 font-medium">Digital & Offset Printing</span>
				</div>
			</div>

			<!-- Caption Singkat & Bersih di Bawah Foto -->
			<div class="relative z-10">
				<p class="text-xs font-bold text-white tracking-wide">Cepat, Akurat & Terpercaya</p>
			</div>
		</div>

		<!-- Kolom Kanan: Form Auth Bersih & Compact -->
		<div class="md:col-span-7 flex flex-col justify-center p-5 sm:p-6 bg-white dark:bg-slate-900">
			<!-- Logo Header khusus Mobile (karena di mobile foto kiri disembunyikan) -->
			<div class="md:hidden flex items-center gap-2 mb-3.5">
				<img src="/logo.png" alt="Logo" class="h-7 w-7 rounded-lg object-contain bg-white p-0.5 shadow-2xs" />
				<div>
					<span class="block text-xs font-black tracking-tight text-slate-900 dark:text-white leading-none">FD DIGITAL PRINTING</span>
					<span class="block text-[9px] text-slate-400 font-medium">Digital & Offset Printing</span>
				</div>
			</div>

			<!-- Form Slot -->
			{@render children()}
		</div>
	</div>
</div>
