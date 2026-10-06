<script lang="ts">
	/**
	 * DipiChat — panel chat AI "Dipi".
	 * ------------------------------------------------------------------
	 * Mengirim pesan ke POST /api/ai/assistant. Selama endpoint backend
	 * belum disambung ke nine-router, otomatis pakai mock brain lokal
	 * (jawaban info toko + fallback) agar UI bisa dites end-to-end.
	 */
	import { X, Send, Sparkles } from 'lucide-svelte';
	import type { DipiMood } from './dipiSensory';

	interface ChatCard {
		kind: 'price' | 'order' | 'info';
		title: string;
		rows: { label: string; value: string }[];
		note?: string;
	}
	interface Msg {
		role: 'user' | 'dipi';
		text: string;
		cards?: ChatCard[];
	}

	let { onClose, onMood, dockSide = 'left' }: {
		onClose: () => void;
		onMood: (m: DipiMood) => void;
		dockSide?: 'left' | 'right';
	} = $props();

	let messages = $state<Msg[]>([
		{
			role: 'dipi',
			text: 'Halo kak! Aku Dipi. Tanya harga cetak, lacak pesanan, atau jam buka toko — siap bantu!'
		}
	]);
	let input = $state('');
	let loading = $state(false);
	let listEl: HTMLDivElement | null = null;

	const QUICK = ['Hitung harga banner', 'Lacak pesanan', 'Jam buka toko'];

	function scrollDown() {
		requestAnimationFrame(() => {
			listEl?.scrollTo({ top: listEl.scrollHeight, behavior: 'smooth' });
		});
	}

	// ---------- mock brain (fallback lokal, ganti dengan API asli) ----------
	// TODO: hapus setelah /api/ai/assistant tersambung ke nine-router.
	function mockBrain(raw: string): { reply: string; mood: DipiMood; cards?: ChatCard[] } {
		const msg = raw.toLowerCase();
		if (/(jam|buka|tutup|operasional)/.test(msg))
			return {
				reply: 'Toko buka Senin–Sabtu jam 10.00–02.00, Minggu jam 10.00–18.00. Alamat: Jl. Raya Wadungasri No. 42, Sidoarjo.',
				mood: 'idle'
			};
		if (/(alamat|lokasi|dimana|di mana|maps)/.test(msg))
			return {
				reply: 'Kami di Jl. Raya Wadungasri No. 42, Wadungasri, Waru, Sidoarjo. Cek peta di bagian bawah halaman utama ya kak!',
				mood: 'idle'
			};
		const m = msg.match(/banner\s*(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/);
		if (m || /(harga|hitung|berapa)/.test(msg)) {
			if (m) {
				const p = parseFloat(m[1].replace(',', '.'));
				const l = parseFloat(m[2].replace(',', '.'));
				const luas = Math.max(1, p * l); // min. 1 m², sesuai aturan kalkulator web
				const total = Math.round(luas * 25000);
				return {
					reply: `Nih estimasinya kak (SIMULASI — sambungkan API untuk harga asli):`,
					mood: 'happy',
					cards: [
						{
							kind: 'price',
							title: `Banner ${m[1]}x${m[2]} m`,
							rows: [
								{ label: 'Luas', value: `${luas.toFixed(1)} m²` },
								{ label: 'Tarif contoh', value: 'Rp 25.000/m²' },
								{ label: 'Estimasi', value: `Rp ${total.toLocaleString('id-ID')}` }
							],
							note: 'Harga asli ikut daftar harga toko.'
						}
					]
				};
			}
			return {
				reply: 'Siap! Sebutkan ukuran panjang x lebarnya ya kak, contoh: "banner 2x1".',
				mood: 'thinking'
			};
		}
		if (/(lacak|cek|status|pesananku|order)/.test(msg))
			return {
				reply: 'Boleh! Kirim kode ordernya ya kak, contoh: FD-A1B2C3. Nanti kutampilkan status cetakannya.',
				mood: 'idle'
			};
		if (/^(halo|hai|hello|pagi|siang|sore|malam)/.test(msg))
			return { reply: 'Halo juga kak! Mau cetak apa hari ini?', mood: 'wave' };
		return {
			reply: 'Hmm, aku belum paham. Coba tanya soal harga cetak, lacak pesanan, atau jam buka toko ya kak!',
			mood: 'confused'
		};
	}

	async function send(text?: string) {
		const content = (text ?? input).trim();
		if (!content || loading) return;
		input = '';
		messages.push({ role: 'user', text: content });
		loading = true;
		onMood('thinking');
		scrollDown();
		try {
			const res = await fetch('/api/ai/assistant', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ message: content })
			});
			if (!res.ok) throw new Error('api-belum-siap');
			const data = await res.json();
			messages.push({ role: 'dipi', text: data.reply, cards: data.cards });
			onMood(data.mood ?? 'idle');
		} catch {
			const fb = mockBrain(content);
			messages.push({ role: 'dipi', text: fb.reply, cards: fb.cards });
			onMood(fb.mood);
		} finally {
			loading = false;
			scrollDown();
		}
	}
</script>

<div
	class="fixed bottom-44 z-[95] flex h-[440px] w-[320px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90"
	class:left-5={dockSide === 'left'}
	class:right-5={dockSide === 'right'}
	role="dialog"
	aria-label="Chat dengan Dipi"
>
	<!-- header -->
	<div class="flex items-center gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-700/70">
		<img
			src="/dipi/dipi-idle.webp"
			alt="Dipi"
			class="h-10 w-10 rounded-full bg-cyan-400/10 object-cover"
		/>
		<div class="min-w-0 flex-1 leading-tight">
			<p class="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
				Dipi <Sparkles class="h-3.5 w-3.5 text-cyan-500" />
			</p>
			<p class="text-[11px] text-slate-500 dark:text-slate-400">Asisten AI FD Printing</p>
		</div>
		<button
			type="button"
			aria-label="Tutup chat"
			onclick={onClose}
			class="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
		>
			<X class="h-4 w-4" />
		</button>
	</div>

	<!-- pesan -->
	<div bind:this={listEl} class="flex-1 space-y-3 overflow-y-auto px-4 py-3">
		{#each messages as m}
			<div class="flex {m.role === 'user' ? 'justify-end' : 'justify-start'}">
				<div
					class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed {m.role === 'user'
						? 'rounded-br-md bg-cyan-500 text-white'
						: 'rounded-bl-md border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}"
				>
					{m.text}
					{#if m.cards}
						{#each m.cards as c}
							<div class="mt-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-900">
								<p class="mb-1.5 text-xs font-bold text-slate-900 dark:text-white">{c.title}</p>
								{#each c.rows as r}
									<div class="flex justify-between py-0.5 text-xs">
										<span class="text-slate-500 dark:text-slate-400">{r.label}</span>
										<span class="font-semibold text-slate-800 dark:text-slate-100">{r.value}</span>
									</div>
								{/each}
								{#if c.note}
									<p class="mt-1.5 text-[10px] italic text-slate-400">{c.note}</p>
								{/if}
							</div>
						{/each}
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
	<div class="flex gap-2 overflow-x-auto px-4 pb-2">
		{#each QUICK as q}
			<button
				type="button"
				onclick={() => send(q)}
				class="shrink-0 rounded-full border border-cyan-500/40 px-3 py-1.5 text-xs font-semibold text-cyan-600 hover:bg-cyan-500/10 dark:text-cyan-400"
			>
				{q}
			</button>
		{/each}
	</div>

	<!-- input -->
	<form
		class="flex items-center gap-2 border-t border-slate-200/70 p-3 dark:border-slate-700/70"
		onsubmit={(e) => {
			e.preventDefault();
			send();
		}}
	>
		<input
			bind:value={input}
			placeholder="Tanya Dipi..."
			aria-label="Tulis pesan untuk Dipi"
			class="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[13px] outline-none focus:border-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
		/>
		<button
			type="submit"
			aria-label="Kirim pesan"
			disabled={loading || !input.trim()}
			class="rounded-full bg-cyan-500 p-2.5 text-white transition hover:bg-cyan-600 disabled:opacity-40"
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
