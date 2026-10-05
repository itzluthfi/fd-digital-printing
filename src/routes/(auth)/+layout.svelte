<script lang="ts">
	import { ArrowLeft, Clock, Sparkles, Zap } from 'lucide-svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans transition-colors antialiased text-slate-900 dark:text-slate-100">
	<div class="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl grid lg:grid-cols-12 min-h-[640px]">
		<!-- ======================================================== -->
		<!-- KOLOM KIRI: VISUAL BANNER & BRANDING (DESKTOP)           -->
		<!-- ======================================================== -->
		<div class="relative hidden lg:flex lg:col-span-6 flex-col justify-between overflow-hidden bg-slate-950 p-8 text-white select-none">
			<!-- Background Image with Overlay -->
			<img
				src="/banner-avatar.png"
				alt="FD Digital Printing"
				class="absolute inset-0 h-full w-full object-cover object-center opacity-85 transition-transform duration-700 hover:scale-105"
			/>
			<div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/40"></div>

			<!-- Top Brand Badge -->
			<div class="relative z-10 flex items-center gap-3">
				<img src="/logo.png" alt="Logo" class="h-10 w-10 rounded-xl bg-white p-1 shadow-md object-contain" />
				<div>
					<span class="block text-base font-black tracking-tight text-white">FD DIGITAL PRINTING</span>
					<span class="block text-xs font-medium text-slate-300">Percetakan Digital, Offset & Merchandise</span>
				</div>
			</div>

			<!-- Bottom Value Proposition & Feature Badges -->
			<div class="relative z-10 space-y-4">
				<div class="space-y-2">
					<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00aeef]/30 text-[#00aeef] text-xs font-bold border border-[#00aeef]/40 backdrop-blur-md">
						<Sparkles class="h-3.5 w-3.5" />
						<span>Cepat, Akurat & Terpercaya</span>
					</span>
					<h2 class="text-2xl font-black leading-snug tracking-tight text-white">
						Wujudkan Semua Kebutuhan Cetakan Anda Bersama Kami
					</h2>
					<p class="text-xs text-slate-300 leading-relaxed max-w-sm">
						Dari spanduk banner, stiker kemasan, brosur promosi, hingga merchandise personal.
					</p>
				</div>

				<div class="space-y-2.5 pt-2 border-t border-white/10 text-xs">
					<div class="flex items-center gap-2.5 text-slate-200">
						<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-[#00aeef]/20 text-[#00aeef]">
							<Zap class="h-3.5 w-3.5" />
						</div>
						<span>Order online langsung & verifikasi QRIS otomatis</span>
					</div>
					<div class="flex items-center gap-2.5 text-slate-200">
						<div class="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
							<Clock class="h-3.5 w-3.5" />
						</div>
						<span>Pantau status antrean produksi secara real-time</span>
					</div>
				</div>
			</div>
		</div>

		<!-- ======================================================== -->
		<!-- KOLOM KANAN: FORM CARD & CONTROLS                        -->
		<!-- ======================================================== -->
		<div class="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 bg-white dark:bg-slate-900">
			<!-- Header Action: Back to Home + Theme Toggle -->
			<div class="flex items-center justify-between mb-4">
				<a
					href="/"
					class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
				>
					<ArrowLeft class="h-4 w-4" />
					<span>Kembali ke Beranda</span>
				</a>
				<ThemeToggle class="h-8 w-8" />
			</div>

			<!-- Mobile Header Banner (Only visible on small screens) -->
			<div class="lg:hidden mb-6 flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
				<img src="/logo.png" alt="Logo" class="h-9 w-9 rounded-xl bg-white p-1 shadow-2xs object-contain" />
				<div>
					<span class="block text-sm font-bold text-slate-900 dark:text-white">FD Digital Printing</span>
					<span class="block text-[11px] text-slate-500 dark:text-slate-400">Portal Masuk & Registrasi Akun</span>
				</div>
			</div>

			<!-- Main Form Content -->
			<div class="my-auto w-full max-w-sm mx-auto">
				{@render children()}
			</div>

			<!-- Footer -->
			<div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-400">
				<span>© {new Date().getFullYear()} FD Digital Printing · Jl. Raya Wadungasri No. 42</span>
			</div>
		</div>
	</div>
</div>
