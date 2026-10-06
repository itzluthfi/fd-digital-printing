<script lang="ts">
	/**
	 * DipiChat — panel chat AI interaktif "Dipi".
	 * ------------------------------------------------------------------
	 * Mengirim pesan ke POST /api/ai/assistant.
	 * Mendukung:
	 * - Multi-turn multi-topic percakapan cerdas percetakan.
	 * - Eksekusi aksi interaktif: scroll otomatis ke lokasi/layanan/alur.
	 * - Checkout instan dengan prefill produk, ukuran, nama, telepon, dan auto QRIS.
	 * - Tombol-tombol kartu aksi cepat di bawah balon balasan Dipi.
	 */
	import { onMount } from 'svelte';
	import { X, Send, Sparkles, RotateCcw, ArrowRight, ExternalLink, ShoppingCart, MapPin } from 'lucide-svelte';
	import type { DipiMood } from './dipiSensory';

	interface ChatCard {
		kind: 'price' | 'order' | 'info';
		title: string;
		rows: { label: string; value: string }[];
		note?: string;
	}

	export interface ChatAction {
		type: 'checkout' | 'scroll' | 'track' | 'whatsapp' | 'navigate';
		label: string;
		url?: string;
		targetId?: string;
		autoExecute?: boolean;
		params?: Record<string, any>;
	}

	interface Msg {
		role: 'user' | 'dipi';
		text: string;
		cards?: ChatCard[];
		actions?: ChatAction[];
	}

	let { onClose, onMood, dockSide = 'left', offsetBottom = 96 }: {
		onClose: () => void;
		onMood: (m: DipiMood) => void;
		dockSide?: 'left' | 'right';
		offsetBottom?: number;
	} = $props();

	const STORAGE_KEY = 'dipi_chat_session_v1';
	const DEFAULT_GREETING: Msg = {
		role: 'dipi',
		text: 'Halo kak! Aku Dipi. Tanya harga cetak, lacak pesanan, atau minta langsung checkout — siap bantu!',
		actions: [
			{
				type: 'scroll',
				targetId: 'layanan',
				label: '📋 Lihat Katalog & Harga'
			},
			{
				type: 'scroll',
				targetId: 'lokasi',
				label: '📍 Alamat & Jam Buka'
			}
		]
	};

	let messages = $state<Msg[]>([DEFAULT_GREETING]);
	let input = $state('');
	let loading = $state(false);
	let listEl: HTMLDivElement | null = null;

	const QUICK = ['Hitung banner MM 2x1', 'Pesan cetak foto', 'Lokasi toko', 'Jam buka'];

	onMount(() => {
		try {
			const saved = sessionStorage.getItem(STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				if (Array.isArray(parsed) && parsed.length > 0) {
					messages = parsed;
				}
			}
		} catch {
			// abaikan error storage
		}
	});

	$effect(() => {
		if (typeof window !== 'undefined' && messages.length > 0) {
			try {
				sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
			} catch {
				// abaikan quota error
			}
		}
	});

	function clearChat() {
		messages = [
			{
				role: 'dipi',
				text: 'Halo kak! Sesi obrolan direset. Mau tanya harga cetak, lacak order, atau pesan apa hari ini?'
			}
		];
		try {
			sessionStorage.removeItem(STORAGE_KEY);
		} catch {}
		onMood('wave');
	}

	function scrollDown() {
		requestAnimationFrame(() => {
			listEl?.scrollTo({ top: listEl.scrollHeight, behavior: 'smooth' });
		});
	}

	function executeAction(act: ChatAction) {
		if (act.type === 'scroll' && act.targetId) {
			const el = document.getElementById(act.targetId);
			if (el) {
				el.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} else {
				window.location.href = `/#${act.targetId}`;
			}
		} else if (act.type === 'checkout' || act.type === 'navigate' || act.type === 'track') {
			if (act.url) {
				window.location.href = act.url;
			}
		} else if (act.type === 'whatsapp') {
			if (act.url) {
				window.open(act.url, '_blank', 'noopener,noreferrer');
			}
		}
	}

	// ---------- mock brain (fallback darurat offline) ----------
	function mockBrain(raw: string): { reply: string; mood: DipiMood; cards?: ChatCard[]; actions?: ChatAction[] } {
		const msg = raw.toLowerCase();
		if (/(jam|buka|tutup|operasional)/.test(msg)) {
			return {
				reply: 'Toko buka Senin–Sabtu jam 10.00–02.00, Minggu jam 10.00–18.00. Alamat: Jl. Raya Wadungasri No. 42, Sidoarjo.',
				mood: 'idle',
				actions: [
					{
						type: 'scroll',
						targetId: 'lokasi',
						label: '📍 Cek Peta Lokasi Toko'
					}
				]
			};
		}
		if (/(alamat|lokasi|dimana|di mana|maps)/.test(msg)) {
			return {
				reply: 'Kami di Jl. Raya Wadungasri No. 42, Wadungasri, Waru, Sidoarjo. Cek peta di bagian bawah halaman utama ya kak!',
				mood: 'point',
				actions: [
					{
						type: 'scroll',
						targetId: 'lokasi',
						label: '📍 Gulir ke Peta Toko'
					}
				]
			};
		}
		if (/^(mm|flexi)$/i.test(msg)) {
			return {
				reply: 'Cetak Banner MM tarifnya Rp 25.000/m² kak. Berapa meter x berapa meter ukurannya? Contoh: "2x1".',
				mood: 'happy',
				actions: [
					{
						type: 'checkout',
						label: '🛒 Buka Form Banner MM',
						url: '/produk/cetak-banner-mm-bohi2h'
					}
				]
			};
		}
		if (/^korea$/i.test(msg)) {
			return {
				reply: 'Cetak Banner Korea 440gsm tarifnya Rp 35.000/m² kak. Berapa meter x berapa meter ukurannya? Contoh: "3x1".',
				mood: 'happy',
				actions: [
					{
						type: 'checkout',
						label: '🛒 Buka Form Banner Korea',
						url: '/produk/cetak-banner-korea-boh6d6'
					}
				]
			};
		}
		const m = msg.match(/banner\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/);
		if (m || /(harga|hitung|berapa)/.test(msg)) {
			if (m) {
				const p = parseFloat(m[1].replace(',', '.'));
				const l = parseFloat(m[2].replace(',', '.'));
				const luas = Math.max(1, p * l);
				const total = Math.round(luas * 25000);
				return {
					reply: `Nih estimasinya kak untuk Banner ${m[1]}×${m[2]} m:`,
					mood: 'happy',
					cards: [
						{
							kind: 'price',
							title: `Banner ${m[1]}x${m[2]} m`,
							rows: [
								{ label: 'Luas', value: `${luas.toFixed(1)} m²` },
								{ label: 'Tarif contoh', value: 'Rp 25.000/m²' },
								{ label: 'Estimasi', value: `Rp ${total.toLocaleString('id-ID')}` }
							]
						}
					],
					actions: [
						{
							type: 'checkout',
							label: `🛒 Pesan Banner ${p}x${l}m Sekarang`,
							url: `/produk/cetak-banner-mm-bohi2h?panjang=${p}&lebar=${l}&qty=1`
						}
					]
				};
			}
			return {
				reply: 'Siap! Sebutkan ukuran panjang x lebarnya ya kak, contoh: "banner 2x1".',
				mood: 'thinking'
			};
		}
		if (/(lacak|cek|status|pesananku|order)/.test(msg)) {
			return {
				reply: 'Boleh! Kirim kode ordernya ya kak, contoh: FD-0001BH. Nanti kutampilkan status cetakannya.',
				mood: 'idle'
			};
		}
		if (/^(halo|hai|hello|pagi|siang|sore|malam)/.test(msg)) {
			return { reply: 'Halo juga kak! Mau cetak apa hari ini?', mood: 'wave' };
		}
		return {
			reply: 'Dipi siap bantu kak! Tanya harga cetak (mis. "banner MM 2x1"), lacak pesanan, atau minta langsung checkout ya~',
			mood: 'idle'
		};
	}

	async function send(text?: string) {
		const content = (text ?? input).trim();
		if (!content || loading) return;
		input = '';

		// Ambil riwayat obrolan sebelum pesan baru dimasukkan
		const historyPayload = messages.slice(-10).map((m) => ({
			role: m.role,
			text: m.text
		}));

		messages.push({ role: 'user', text: content });
		loading = true;
		onMood('thinking');
		scrollDown();

		try {
			const res = await fetch('/api/ai/assistant', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					message: content,
					history: historyPayload
				})
			});
			if (!res.ok) throw new Error('api-belum-siap');
			const data = await res.json();
			messages.push({
				role: 'dipi',
				text: data.reply,
				cards: data.cards,
				actions: data.actions
			});
			onMood(data.mood ?? 'idle');

			// Jika ada action autoExecute (misal: auto redirect ke form checkout atau scroll otomatis)
			if (data.action?.autoExecute) {
				window.setTimeout(() => {
					executeAction(data.action);
				}, 750);
			}
		} catch {
			const fb = mockBrain(content);
			messages.push({
				role: 'dipi',
				text: fb.reply,
				cards: fb.cards,
				actions: fb.actions
			});
			onMood(fb.mood);
		} finally {
			loading = false;
			scrollDown();
		}
	}
</script>

<div
	class="fixed z-[95] flex h-[480px] max-h-[calc(100vh-100px)] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 bottom-4 sm:bottom-8 transition-all"
	class:left-4={dockSide === 'left'}
	class:sm:left-36={dockSide === 'left'}
	class:right-4={dockSide === 'right'}
	class:sm:right-36={dockSide === 'right'}
	role="dialog"
	aria-label="Chat dengan Dipi"
>
	<!-- header -->
	<div class="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/30">
		<div class="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cyan-400/10 ring-2 ring-cyan-500/30">
			<img
				src="/dipi/dipi-idle.webp"
				alt="Dipi"
				class="h-full w-full object-cover"
				style="object-position: center 6%; transform: scale(1.15);"
			/>
		</div>
		<div class="min-w-0 flex-1 leading-tight">
			<p class="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
				Dipi <Sparkles class="h-3.5 w-3.5 text-cyan-500" />
			</p>
			<p class="text-[11px] text-slate-500 dark:text-slate-400">Asisten AI FD Printing</p>
		</div>
		<div class="flex items-center gap-1">
			<button
				type="button"
				title="Mulai ulang / bersihkan obrolan"
				aria-label="Mulai ulang obrolan"
				onclick={clearChat}
				class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
			>
				<RotateCcw class="h-4 w-4" />
			</button>
			<button
				type="button"
				aria-label="Tutup chat"
				onclick={onClose}
				class="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	</div>

	<!-- pesan -->
	<div bind:this={listEl} class="flex-1 space-y-3 overflow-y-auto px-4 py-3">
		{#each messages as m}
			<div class="flex {m.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div
					class="max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-2xs {m.role === 'user'
						? 'rounded-br-md bg-[#00aeef] text-white'
						: 'rounded-bl-md border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}"
				>
					{m.text}

					<!-- Cards jika ada -->
					{#if m.cards}
						{#each m.cards as c}
							<div class="mt-2.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-900 shadow-2xs">
								<p class="mb-1.5 text-xs font-bold text-slate-900 dark:text-white">{c.title}</p>
								{#each c.rows as r}
									<div class="flex justify-between py-0.5 text-xs">
										<span class="text-slate-500 dark:text-slate-400">{r.label}</span>
										<span class="font-semibold text-slate-800 dark:text-slate-100">{r.value}</span>
									</div>
								{/each}
								{#if c.note}
									<p class="mt-1.5 text-[10px] italic text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-1">{c.note}</p>
								{/if}
							</div>
						{/each}
					{/if}

					<!-- Interactive Action Buttons -->
					{#if m.actions && m.actions.length > 0}
						<div class="mt-2.5 flex flex-col gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
							{#each m.actions as act}
								<button
									type="button"
									onclick={() => executeAction(act)}
									class="flex w-full items-center justify-between gap-2 rounded-xl bg-cyan-500/10 px-3 py-2 text-left text-xs font-semibold text-cyan-700 transition hover:bg-[#00aeef] hover:text-white dark:bg-cyan-500/20 dark:text-cyan-300 dark:hover:bg-[#00aeef] dark:hover:text-white group active:scale-98"
								>
									<span class="truncate">{act.label}</span>
									<ArrowRight class="h-3.5 w-3.5 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
		{#if loading}
			<div class="flex justify-start">
				<div class="rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
					<span class="flex gap-1">
						<span class="dipi-dot h-1.5 w-1.5 rounded-full bg-slate-400"></span>
						<span class="dipi-dot dipi-dot-2 h-1.5 w-1.5 rounded-full bg-slate-400"></span>
						<span class="dipi-dot dipi-dot-3 h-1.5 w-1.5 rounded-full bg-slate-400"></span>
					</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- quick chips -->
	<div class="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-none">
		{#each QUICK as q}
			<button
				type="button"
				onclick={() => send(q)}
				class="shrink-0 rounded-full border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400 transition"
			>
				{q}
			</button>
		{/each}
	</div>

	<!-- input -->
	<form
		class="flex items-center gap-2 border-t border-slate-200/70 p-3 dark:border-slate-700/70 bg-white dark:bg-slate-900"
		onsubmit={(e) => {
			e.preventDefault();
			send();
		}}
	>
		<input
			bind:value={input}
			placeholder="Tanya harga, minta checkout, lokasi..."
			aria-label="Tulis pesan untuk Dipi"
			class="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] outline-none focus:border-[#00aeef] dark:border-slate-700 dark:bg-slate-800 dark:text-white transition"
		/>
		<button
			type="submit"
			aria-label="Kirim pesan"
			disabled={loading || !input.trim()}
			class="rounded-full bg-[#00aeef] p-2.5 text-white transition hover:bg-[#0092c9] disabled:opacity-40 shadow-xs active:scale-95"
		>
			<Send class="h-4 w-4" />
		</button>
	</form>
</div>

<style>
	.dipi-dot {
		animation: dipi-blink 1.2s infinite;
	}
	.dipi-dot-2 {
		animation-delay: 0.2s;
	}
	.dipi-dot-3 {
		animation-delay: 0.4s;
	}
	@keyframes dipi-blink {
		0%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(-3px);
		}
	}
</style>
