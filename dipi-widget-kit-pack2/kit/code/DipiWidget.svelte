<script lang="ts">
	/**
	 * DipiWidget — maskot AI floating "Dipi" untuk FD Digital Printing.
	 * ------------------------------------------------------------------
	 * - 8 pose WebP transparan (taruh di static/dipi/)
	 * - Idle float (CSS) + parallax ngikutin mouse (rAF lerp)
	 * - Draggable + snap ke tepi kiri/kanan (default: kiri bawah,
	 *   agar tidak tabrakan dengan tombol WA floating kanan bawah)
	 * - Balon ucapan kontekstual per route + behavioral engine
	 * - Klik → buka panel chat (DipiChat.svelte)
	 *
	 * Cara pasang: lihat README.md di kit ini.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import DipiChat from './DipiChat.svelte';
	import { DipiSensory, type DipiMood } from './dipiSensory';

	const POSE: Record<DipiMood, string> = {
		// idle pakai versi ANIMATED (kedip tiap ±3 detik) biar berasa hidup.
		// Ganti ke '/dipi/dipi-idle.webp' kalau mau versi statis yang ringan.
		idle: '/dipi/dipi-idle-blink.webp',
		sit: '/dipi/dipi-sit.webp',
		wave: '/dipi/dipi-wave-anim.webp', // ANIMATED: tangan melambai (fallback: dipi-wave.webp)
		thinking: '/dipi/dipi-thinking.webp',
		happy: '/dipi/dipi-happy.webp',
		celebrate: '/dipi/dipi-celebrate-anim.webp', // ANIMATED: lompat selebrasi (fallback: dipi-celebrate.webp)
		confused: '/dipi/dipi-confused.webp',
		point: '/dipi/dipi-point.webp',
		package: '/dipi/dipi-package.webp',
		writing: '/dipi/dipi-writing.webp',
		phone: '/dipi/dipi-phone.webp',
		money: '/dipi/dipi-money.webp',
		idea: '/dipi/dipi-idea.webp',
		thanks: '/dipi/dipi-thanks.webp',
		surprised: '/dipi/dipi-surprised.webp',
		sleep: '/dipi/dipi-sleep.webp',
		peek: '/dipi/dipi-peek.webp'
	};

	let mood = $state<DipiMood>('idle');
	let bubble = $state<string | null>(null);
	let bubbleTimer = 0;
	let chatOpen = $state(false);

	// posisi: dock kiri/kanan + offset dari bawah (px)
	let dock = $state<'left' | 'right'>('left');
	let offsetY = $state(96);
	let dragging = $state(false);

	// parallax state (di-lerp di rAF)
	let px = $state(0);
	let py = $state(0);
	let prot = $state(0);
	let tx = 0;
	let ty = 0;
	let trot = 0;
	let wrapEl: HTMLDivElement | null = null;
	let dragStart: { x: number; y: number; moved: boolean } | null = null;
	let pokeCount = 0;
	let pokeTimer = 0;
	let greetedRoutes = new Set<string>();
	let reducedMotion = $state(false);

	const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

	function say(text: string | null, ms = 5000) {
		window.clearTimeout(bubbleTimer);
		bubble = text;
		if (text && ms > 0) {
			bubbleTimer = window.setTimeout(() => {
				bubble = null;
			}, ms);
		}
	}

	function setMood(m: DipiMood) {
		mood = m;
	}

	// ---------- sapaan kontekstual per route ----------
	function greetForRoute(path: string) {
		if (greetedRoutes.has(path)) return;
		greetedRoutes.add(path);
		if (path === '/') {
			setMood('wave');
			say('Halo kak! Aku Dipi, asisten FD Printing. Butuh bantuan cetak?', 7000);
		} else if (path.startsWith('/produk')) {
			setMood('idle');
			say('Lihat-lihat dulu kak~ Mau kubantu hitungin harga cetaknya?', 7000);
		} else if (path.startsWith('/pesan/sukses')) {
			setMood('happy');
			say('Yess! Pesananmu masuk. Tinggal bayar, langsung naik mesin cetak!', 7000);
		} else if (path.startsWith('/pesan')) {
			setMood('idle');
			say('Isi ukuran panjang x lebarnya ya kak, nanti kubantu cek estimasi.', 7000);
		}
	}

	// ---------- drag & snap ----------
	function onPointerDown(e: PointerEvent) {
		dragStart = { x: e.clientX, y: e.clientY, moved: false };
		(wrapEl as HTMLElement | null)?.setPointerCapture?.(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragStart) return;
		const dx = e.clientX - dragStart.x;
		const dy = e.clientY - dragStart.y;
		if (Math.abs(dx) + Math.abs(dy) > 8) {
			dragStart.moved = true;
			dragging = true;
		}
		if (dragging) {
			// geser: x menentukan dock, y menentukan offset dari bawah
			dock = e.clientX < window.innerWidth / 2 ? 'left' : 'right';
			offsetY = clamp(window.innerHeight - e.clientY - 60, 80, window.innerHeight - 180);
		}
	}

	function onPointerUp() {
		const wasDrag = dragStart?.moved ?? false;
		dragStart = null;
		dragging = false;
		if (!wasDrag) toggleChat();
		else {
			// habis drag → pose mengintip sekilas biar playful
			setMood('peek');
			window.setTimeout(() => {
				if (!dragging) setMood('idle');
			}, 1200);
		}
		sensory?.poke();
	}

	function toggleChat() {
		chatOpen = !chatOpen;
		sensory?.poke();
		if (chatOpen) {
			setMood('idle');
			say(null);
		}
	}

	// easter egg: klik cepat 5x → Dipi kegelian
	function onMascotClick() {
		pokeCount++;
		window.clearTimeout(pokeTimer);
		pokeTimer = window.setTimeout(() => (pokeCount = 0), 900);
		if (pokeCount >= 5) {
			pokeCount = 0;
			setMood('happy');
			say('Hihihi geli! Oke oke, ada yang bisa kubantu?', 4000);
		}
	}

	// ---------- parallax ngikutin mouse ----------
	function onWindowPointerMove(e: PointerEvent) {
		if (reducedMotion || dragging || !wrapEl) return;
		const r = wrapEl.getBoundingClientRect();
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		tx = clamp((e.clientX - cx) / 40, -10, 10);
		ty = clamp((e.clientY - cy) / 40, -8, 8);
		trot = clamp((e.clientX - cx) / 70, -8, 8);
	}

	let sensory: DipiSensory | null = null;
	let lastPath = '';

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		// preload semua pose biar ganti pose tidak kedip
		Object.values(POSE).forEach((src) => {
			const img = new Image();
			img.src = src;
		});
		sensory = new DipiSensory({ onMood: setMood, onSay: say });
		// sapaan awal
		setMood('wave');
		window.setTimeout(() => {
			if (mood === 'wave' && !chatOpen) setMood('idle');
		}, 2600);

		// rAF loop untuk parallax halus
		let raf = 0;
		const tick = () => {
			px += (tx - px) * 0.12;
			py += (ty - py) * 0.12;
			prot += (trot - prot) * 0.12;
			raf = requestAnimationFrame(tick);
		};
		if (!reducedMotion) raf = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(raf);
			sensory?.destroy();
			sensory = null;
			window.clearTimeout(bubbleTimer);
		};
	});

	// sapaan tiap ganti route (sekali per route per sesi)
	$effect(() => {
		const path = page.url.pathname;
		if (path !== lastPath) {
			lastPath = path;
			greetForRoute(path);
		}
	});

	// event dari halaman lain, mis. halaman sukses order:
	//   window.dispatchEvent(new CustomEvent('dipi:order-success'))
	$effect(() => {
		const handler = () => {
			setMood('celebrate');
			say('Yess! QRIS siap di-scan. Tinggal bayar langsung masuk mesin cetak!', 7000);
		};
		window.addEventListener('dipi:order-success', handler);
		return () => window.removeEventListener('dipi:order-success', handler);
	});

	const poseSrc = $derived(POSE[mood]);
	// pose peek/surprised/point di-mirror saat dock kanan agar menghadap konten
	const mirrored = $derived(
		dock === 'right' && (mood === 'peek' || mood === 'surprised' || mood === 'point')
	);
</script>

<svelte:window onpointermove={onWindowPointerMove} />

<!-- panel chat -->
{#if chatOpen}
	<DipiChat
		onClose={() => (chatOpen = false)}
		onMood={setMood}
		dockSide={dock}
	/>
{/if}

<!-- widget floating -->
<div
	bind:this={wrapEl}
	class="dipi-float fixed z-[90] select-none"
	class:left-5={dock === 'left'}
	class:right-5={dock === 'right'}
	style:bottom="{offsetY}px"
	role="presentation"
>
	<!-- balon ucapan -->
	{#if bubble}
		<div
			class="dipi-bubble absolute bottom-full mb-3 w-56 rounded-2xl rounded-bl-md border border-slate-200 bg-white/95 px-3.5 py-2.5 text-[13px] leading-snug text-slate-700 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
			class:left-0={dock === 'left'}
			class:right-0={dock === 'right'}
		>
			{bubble}
		</div>
	{/if}

	<!-- gelembung Zzz saat tidur -->
	{#if mood === 'sleep'}
		<div class="pointer-events-none absolute -top-2 left-6 flex gap-1 text-slate-400 dark:text-slate-500" aria-hidden="true">
			<span class="dipi-zzz text-sm font-bold">z</span>
			<span class="dipi-zzz dipi-zzz-2 text-base font-bold">z</span>
			<span class="dipi-zzz dipi-zzz-3 text-lg font-bold">z</span>
		</div>
	{/if}

	<button
		type="button"
		aria-label="Buka chat Dipi, asisten FD Printing"
		class="dipi-mascot relative block w-24 cursor-grab active:cursor-grabbing sm:w-28"
		class:dipi-dragging={dragging}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onclick={onMascotClick}
	>
		<span
			class="block will-change-transform"
			style:transform="translate3d({px.toFixed(1)}px, {py.toFixed(1)}px, 0) rotate({prot.toFixed(1)}deg) {mirrored
				? 'scaleX(-1)'
				: ''}"
		>
			<img
				src={poseSrc}
				alt="Dipi, maskot AI FD Digital Printing"
				class="pointer-events-none h-auto w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
				draggable="false"
			/>
		</span>
		<!-- halo status AI -->
		<span
			class="pointer-events-none absolute -bottom-1 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-cyan-400/40 blur-md dark:bg-cyan-400/30"
			aria-hidden="true"
		></span>
	</button>
</div>

<style>
	/* melayang santai (nonaktif saat drag / reduced motion) */
	.dipi-float:not(.dipi-dragging) .dipi-mascot {
		animation: dipi-hover 4s ease-in-out infinite;
	}
	@keyframes dipi-hover {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-9px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dipi-float .dipi-mascot {
			animation: none;
		}
	}

	.dipi-bubble {
		animation: dipi-pop 0.25s ease-out;
	}
	@keyframes dipi-pop {
		from {
			opacity: 0;
			transform: translateY(6px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.dipi-zzz {
		animation: dipi-zzz 2.4s ease-in-out infinite;
		opacity: 0;
	}
	.dipi-zzz-2 {
		animation-delay: 0.5s;
	}
	.dipi-zzz-3 {
		animation-delay: 1s;
	}
	@keyframes dipi-zzz {
		0% {
			opacity: 0;
			transform: translateY(6px) scale(0.8);
		}
		40% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translateY(-14px) scale(1.1);
		}
	}
</style>
