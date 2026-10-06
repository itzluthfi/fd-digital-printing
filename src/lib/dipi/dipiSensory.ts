/**
 * DipiSensory — mesin perilaku maskot Dipi (FD Digital Printing).
 * ------------------------------------------------------------------
 * Pure TypeScript, tanpa dependensi framework. Tugasnya satu:
 * mendengarkan perilaku user di browser, lalu memancarkan event
 * `mood` (ganti pose) dan `say` (balon ucapan) ke widget.
 *
 * Dipakai oleh: src/lib/dipi/DipiWidget.svelte
 */

export type DipiMood =
	| 'idle' // berdiri santai (default floating)
	| 'sit' // duduk bersila (idle alternatif / santai)
	| 'wave' // melambai (sapa / selamat datang kembali)
	| 'thinking' // mikir (AI sedang loading / verifikasi)
	| 'happy' // senang (copy teks, easter egg)
	| 'celebrate' // selebrasi tangan ke atas (order/QRIS sukses)
	| 'confused' // bingung (AI tidak paham pertanyaan)
	| 'point' // menunjuk (mengarahkan ke konten)
	| 'surprised' // kaget (rage-click, exit intent)
	| 'sleep' // tidur (AFK lama)
	| 'peek' // mengintip (pose saat dock di tepi layar)
	| 'money' // memegang uang/dompet (saat pembayaran QRIS / checkout)
	| 'writing' // mencatat (saat mengisi form checkout)
	| 'phone' // memegang HP (saat CS WhatsApp / konfirmasi)
	| 'package' // membawa paket (saat pesanan selesai / siap ambil)
	| 'thanks' // salam terima kasih (saat transaksi sukses)
	| 'idea'; // lampu bohlam (saat FAQ / tips cetak)

export interface DipiSensoryHooks {
	onMood: (mood: DipiMood) => void;
	onSay: (text: string | null, ms?: number) => void;
}

interface DipiSensoryOpts {
	/** ms tanpa interaksi → nudge "bengong" (default 25000) */
	idleMs?: number;
	/** ms tanpa interaksi → tidur (default 60000) */
	sleepMs?: number;
}

const RAGE_WINDOW_MS = 900;
const RAGE_MIN_CLICKS = 3;

export class DipiSensory {
	private hooks: DipiSensoryHooks;
	private idleMs: number;
	private sleepMs: number;
	private idleTimer = 0;
	private sleepTimer = 0;
	private clickStamps: number[] = [];
	private lastTarget: EventTarget | null = null;
	private exitFired = false;
	private sleeping = false;
	private destroyed = false;

	// referensi handler agar bisa di-remove dengan benar
	private onActivity = () => this.poke();
	private onClick = (e: MouseEvent) => this.handleClick(e);
	private onCopy = () => this.handleCopy();
	private onMouseOut = (e: MouseEvent) => this.handleMouseOut(e);
	private onVisibility = () => this.handleVisibility();

	constructor(hooks: DipiSensoryHooks, opts: DipiSensoryOpts = {}) {
		this.hooks = hooks;
		this.idleMs = opts.idleMs ?? 25000;
		this.sleepMs = opts.sleepMs ?? 60000;
		this.bind();
		this.armTimers();
	}

	/** panggil dari widget setiap ada interaksi langsung dengan Dipi */
	poke = () => {
		if (this.destroyed) return;
		if (this.sleeping) this.wake();
		else this.armTimers();
	};

	get isSleeping() {
		return this.sleeping;
	}

	destroy() {
		this.destroyed = true;
		const acts = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
		acts.forEach((ev) => window.removeEventListener(ev, this.onActivity));
		document.removeEventListener('click', this.onClick);
		document.removeEventListener('copy', this.onCopy);
		document.removeEventListener('mouseout', this.onMouseOut);
		document.removeEventListener('visibilitychange', this.onVisibility);
		window.clearTimeout(this.idleTimer);
		window.clearTimeout(this.sleepTimer);
	}

	private bind() {
		const acts = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
		acts.forEach((ev) => window.addEventListener(ev, this.onActivity, { passive: true }));
		document.addEventListener('click', this.onClick);
		document.addEventListener('copy', this.onCopy);
		document.addEventListener('mouseout', this.onMouseOut);
		document.addEventListener('visibilitychange', this.onVisibility);
	}

	private armTimers() {
		window.clearTimeout(this.idleTimer);
		window.clearTimeout(this.sleepTimer);
		this.idleTimer = window.setTimeout(() => {
			if (this.destroyed || this.sleeping) return;
			this.hooks.onMood('sit');
			this.hooks.onSay('Halo? Masih di situ kak? Jangan sungkan tanya-tanya ya~', 6000);
		}, this.idleMs);
		this.sleepTimer = window.setTimeout(() => {
			if (this.destroyed || this.sleeping) return;
			this.sleeping = true;
			this.hooks.onMood('sleep');
			this.hooks.onSay(null);
		}, this.sleepMs);
	}

	private wake() {
		this.sleeping = false;
		this.hooks.onMood('wave');
		this.hooks.onSay('Eh, kukira ditinggal! Yuk lanjut~', 4000);
		this.armTimers();
	}

	private handleClick(e: MouseEvent) {
		if (this.destroyed) return;
		const now = Date.now();
		// rage-click: klik cepat beruntun pada target yang sama
		if (e.target === this.lastTarget) this.clickStamps.push(now);
		else {
			this.clickStamps = [now];
			this.lastTarget = e.target;
		}
		this.clickStamps = this.clickStamps.filter((t) => now - t < RAGE_WINDOW_MS);
		if (this.clickStamps.length >= RAGE_MIN_CLICKS) {
			this.clickStamps = [];
			this.hooks.onMood('surprised');
			this.hooks.onSay('Eh santai kak, tombolnya macet ya? Butuh bantuan?', 5000);
		}
	}

	private handleCopy() {
		if (this.destroyed || this.sleeping) return;
		this.hooks.onMood('happy');
		this.hooks.onSay('Teks disalin! Mau langsung kubuatkan nota pesanannya?', 5000);
	}

	private handleMouseOut(e: MouseEvent) {
		// Nonaktifkan exit-intent agresif agar tidak menimpa dialog seksi yang sedang dibaca user
	}

	private handleVisibility() {
		if (this.destroyed) return;
		if (document.hidden) {
			this.sleeping = true;
			this.hooks.onMood('sleep');
			this.hooks.onSay(null);
		} else if (this.sleeping) {
			this.wake();
		}
	}
}
