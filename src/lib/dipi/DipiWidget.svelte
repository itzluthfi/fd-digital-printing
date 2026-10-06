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
	import { pushState } from '$app/navigation';
	import DipiChat from './DipiChat.svelte';
	import { DipiSensory, type DipiMood } from './dipiSensory';
	import {
		getRandomDialogue,
		getProductHoverDialogue,
		getFormInvalidDialogue,
		getAuthInvalidDialogue,
		getAuthFailedDialogue
	} from './dipiDialogues';

	const POSE: Record<DipiMood, string> = {
		idle: '/dipi/dipi-idle.webp',
		sit: '/dipi/dipi-sit.webp',
		wave: '/dipi/dipi-wave.webp',
		thinking: '/dipi/dipi-thinking.webp',
		happy: '/dipi/dipi-happy.webp',
		celebrate: '/dipi/dipi-celebrate.webp',
		confused: '/dipi/dipi-confused.webp',
		point: '/dipi/dipi-point.webp',
		surprised: '/dipi/dipi-surprised.webp',
		sleep: '/dipi/dipi-sleep.webp',
		peek: '/dipi/dipi-peek.webp',
		money: '/dipi/dipi-money.webp',
		writing: '/dipi/dipi-writing.webp',
		phone: '/dipi/dipi-phone.webp',
		package: '/dipi/dipi-package.webp',
		thanks: '/dipi/dipi-thanks.webp',
		idea: '/dipi/dipi-idea.webp'
	};

	let mood = $state<DipiMood>('idle');
	let bubble = $state<string | null>(null);
	let bubbleTimer = 0;
	let chatOpen = $state(false);

	// posisi: dock kiri/kanan + offset dari bawah (px) atau koordinat bebas (posX, posY)
	let dock = $state<'left' | 'right'>('left');
	let offsetY = $state(96);
	let posX = $state<number | null>(null);
	let posY = $state<number | null>(null);
	let isDragging = $state(false);
	let dragMoved = false;
	let startPointerX = 0;
	let startPointerY = 0;
	let initialLeft = 0;
	let initialTop = 0;

	// parallax state (di-lerp di rAF)
	let px = $state(0);
	let py = $state(0);
	let prot = $state(0);
	let tx = 0;
	let ty = 0;
	let trot = 0;
	let wrapEl: HTMLDivElement | null = null;
	let pokeCount = 0;
	let pokeTimer = 0;
	let greetedRoutes = new Set<string>();
	let reducedMotion = $state(false);

	// Section observer state
	let activeSection = $state<string | null>(null);
	let lastSectionSpeechTime = 0;
	let sectionDebounceTimer: number = 0;

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
		if (path === '/') {
			// Saat kembali ke beranda, biarkan observer seksi yang menentukan dialog aktif berdasarkan posisi scroll
			return;
		} else if (path.startsWith('/produk')) {
			const dialogue = getRandomDialogue('produk', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 7000);
				lastSectionSpeechTime = Date.now();
			}
		} else if (path.startsWith('/pesan/sukses')) {
			const dialogue = getRandomDialogue('pesan_sukses', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 7000);
				lastSectionSpeechTime = Date.now();
			}
		} else if (path.startsWith('/pesan')) {
			const dialogue = getRandomDialogue('pesan', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 7000);
				lastSectionSpeechTime = Date.now();
			}
		} else if (path === '/sign-in') {
			const dialogue = getRandomDialogue('sign_in', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 7000);
				lastSectionSpeechTime = Date.now();
			}
		} else if (path === '/sign-up') {
			const dialogue = getRandomDialogue('sign_up', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 7000);
				lastSectionSpeechTime = Date.now();
			}
		} else if (path === '/forgot-password') {
			const dialogue = getRandomDialogue('forgot_password', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 7000);
				lastSectionSpeechTime = Date.now();
			}
		}
	}

	// ---------- drag & drop bebas ke mana pun di layar ----------
	function onPointerDown(e: PointerEvent) {
		if (e.button !== 0) return; // hanya klik kiri atau sentuhan jari
		if (!wrapEl) return;
		startPointerX = e.clientX;
		startPointerY = e.clientY;
		const r = wrapEl.getBoundingClientRect();
		initialLeft = r.left;
		initialTop = r.top;
		dragMoved = false;

		const onMove = (ev: PointerEvent) => {
			const dx = ev.clientX - startPointerX;
			const dy = ev.clientY - startPointerY;
			if (!dragMoved && Math.hypot(dx, dy) > 5) {
				dragMoved = true;
				isDragging = true;
			}
			if (isDragging && wrapEl) {
				const w = wrapEl.offsetWidth || 110;
				const h = wrapEl.offsetHeight || 130;
				const maxLeft = Math.max(8, window.innerWidth - w - 8);
				const maxTop = Math.max(8, window.innerHeight - h - 8);

				const nextX = clamp(initialLeft + dx, 8, maxLeft);
				const nextY = clamp(initialTop + dy, 8, maxTop);

				posX = nextX;
				posY = nextY;
				dock = nextX < window.innerWidth / 2 ? 'left' : 'right';
			}
		};

		const onUp = () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);

			if (isDragging) {
				// Tahan status drag sebentar agar event onclick browser setelah mouseup diabaikan
				window.setTimeout(() => {
					isDragging = false;
					dragMoved = false;
				}, 120);

				setMood('peek');
				window.setTimeout(() => {
					if (!isDragging && mood === 'peek') setMood('idle');
				}, 1200);
			} else {
				isDragging = false;
				dragMoved = false;
			}
			sensory?.poke();
		};

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
		window.addEventListener('pointercancel', onUp);
	}

	function toggleChat() {
		chatOpen = !chatOpen;
		sensory?.poke();
		if (chatOpen) {
			setMood('idle');
			say(null);
		}
	}

	// klik pada avatar Dipi
	function onMascotClick() {
		// Jika tadi baru selesai drag, jangan buka/tutup chat
		if (dragMoved) {
			dragMoved = false;
			return;
		}

		toggleChat();

		// easter egg: klik cepat 5x
		pokeCount++;
		window.clearTimeout(pokeTimer);
		pokeTimer = window.setTimeout(() => (pokeCount = 0), 900);
		if (pokeCount >= 5) {
			pokeCount = 0;
			setMood('happy');
			say('Hihihi geli! Mau tanya apa kak?', 4000);
		}
	}

	// ---------- parallax ngikutin mouse saat hover biasa ----------
	function onWindowPointerMove(e: PointerEvent) {
		if (reducedMotion || isDragging || !wrapEl) return;
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
		if (typeof window !== 'undefined' && window.innerWidth < 640) {
			offsetY = 24; // di mobile posisi avatar agak turun sedikit
		}
		// preload semua pose biar ganti pose tidak kedip
		Object.values(POSE).forEach((src) => {
			const img = new Image();
			img.src = src;
		});
		sensory = new DipiSensory({ onMood: setMood, onSay: say });

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

	// sapaan tiap ganti route
	$effect(() => {
		const path = page.url.pathname;
		if (path !== lastPath) {
			lastPath = path;
			greetForRoute(path);
		}
	});

		// observer seksi untuk landing page (atas, layanan, alur-order, lokasi, faq)
	$effect(() => {
		const path = page.url.pathname;
		if (path !== '/') {
			activeSection = null;
			return;
		}

		let scrollCleanup: (() => void) | null = null;
		let observer: IntersectionObserver | null = null;

		const setup = () => {
			const sectionIds = ['atas', 'layanan', 'alur-order', 'lokasi', 'faq'];
			const targets = sectionIds
				.map((id) => ({ id, el: document.getElementById(id) }))
				.filter((item): item is { id: string; el: HTMLElement } => Boolean(item.el));

			if (targets.length === 0) return;

			const checkActiveSection = (isInitial = false) => {
				const vh = window.innerHeight;
				let bestId: string | null = null;
				let maxVisible = -Infinity;

				// Hitung seksi mana yang paling dominan di layar (top 15% - bottom 70%)
				for (const { id, el } of targets) {
					const rect = el.getBoundingClientRect();
					// Jika elemen terlihat di viewport
					const visibleTop = Math.max(0, rect.top);
					const visibleBottom = Math.min(vh, rect.bottom);
					const visibleHeight = Math.max(0, visibleBottom - visibleTop);

					// Tambah bobot untuk elemen yang berada dekat sepertiga atas viewport (titik fokus mata)
					const focalScore = rect.top <= vh * 0.4 && rect.bottom >= vh * 0.2 ? 500 : 0;
					const score = visibleHeight + focalScore;

					if (score > maxVisible && visibleHeight > 40) {
						maxVisible = score;
						bestId = id;
					}
				}

				// Fallback jika di paling atas
				if (window.scrollY < 120) {
					bestId = 'atas';
				}

				if (bestId && bestId !== activeSection) {
					const prev = activeSection;
					activeSection = bestId;

					// 1. Sinkronkan hash di URL browser
					if (typeof window !== 'undefined') {
						const currentHash = window.location.hash;
						const targetHash = bestId === 'atas' ? '' : `#${bestId}`;
						if (currentHash !== targetHash) {
							try {
								pushState(targetHash || window.location.pathname, {});
							} catch {
								window.location.hash = targetHash;
							}
						}
					}

					// 2. Tampilkan dialog avatar Dipi yang responsif
					window.clearTimeout(sectionDebounceTimer);
					const delay = isInitial ? 250 : 100;

					sectionDebounceTimer = window.setTimeout(() => {
						const now = Date.now();
						if (chatOpen || isDragging) return;

						const dialogue = getRandomDialogue(bestId, bubble);
						if (dialogue) {
							lastSectionSpeechTime = now;
							setMood(dialogue.mood);
							say(dialogue.text, dialogue.durationMs ?? 6000);
						}
					}, delay);
				}
			};

			// IntersectionObserver untuk performa tinggi
			if (typeof IntersectionObserver !== 'undefined') {
				observer = new IntersectionObserver(
					() => {
						checkActiveSection(false);
					},
					{
						threshold: [0.1, 0.3, 0.6],
						rootMargin: '-10% 0px -20% 0px'
					}
				);
				targets.forEach(({ el }) => observer?.observe(el));
			}

			// Scroll listener responsif (50ms)
			let scrollTimer = 0;
			const onScroll = () => {
				window.clearTimeout(scrollTimer);
				scrollTimer = window.setTimeout(() => checkActiveSection(false), 50);
			};
			window.addEventListener('scroll', onScroll, { passive: true });

			scrollCleanup = () => {
				window.removeEventListener('scroll', onScroll);
				window.clearTimeout(scrollTimer);
			};

			// Eksekusi langsung saat setup selesai dimuat
			checkActiveSection(true);
		};

		// Jalankan sesegera mungkin di next tick
		const initTimer = window.setTimeout(setup, 60);

		return () => {
			window.clearTimeout(initTimer);
			window.clearTimeout(sectionDebounceTimer);
			observer?.disconnect();
			scrollCleanup?.();
		};
	});

	// event reaksi dinamis: pembayaran sukses, qris muncul, pending bayar, hover item, invalid form
	$effect(() => {
		const handlePaymentSuccess = () => {
			setMood('thanks');
			say('Alhamdulillah lunas! Terima kasih banyak kak! Pesananmu resmi masuk antrean mesin cetak kami sekarang! 🎉', 9000);
			window.setTimeout(() => {
				if (mood === 'thanks') setMood('celebrate');
			}, 3000);
		};

		const handleWaitingPayment = () => {
			setMood('money');
			say('Pesanan tercatat! Scan QRIS di layar ya kak, pembayaran otomatis diverifikasi sistem dalam hitungan detik.', 8000);
		};

		const handleQrisShown = () => {
			setMood('money');
			say('Yuk kak, scan kode QRIS di layar via m-banking atau e-wallet (BCA, GoPay, OVO, Dana). Nominalnya sudah otomatis pas ya~', 9500);
		};

		const handlePaymentPending = () => {
			setMood('phone');
			say('Pembayaranmu belum masuk di mutasi nih kak. Pastikan transfer sudah berhasil, atau klik WhatsApp kasir untuk konfirmasi manual ya!', 9000);
		};

		const handlePaymentExpired = () => {
			const dialogue = getRandomDialogue('bayar_kadaluarsa', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 9000);
			}
		};

		let hoverClearTimer = 0;
		const handleItemHover = (e: Event) => {
			const custom = e as CustomEvent<{ name: string; price?: number; unit?: string }>;
			if (!custom.detail?.name || chatOpen || isDragging) return;
			window.clearTimeout(hoverClearTimer);
			const dialogue = getProductHoverDialogue(custom.detail.name, custom.detail.price, custom.detail.unit);
			setMood(dialogue.mood);
			say(dialogue.text, dialogue.durationMs ?? 6500);
		};

		const handleItemUnhover = () => {
			window.clearTimeout(hoverClearTimer);
			hoverClearTimer = window.setTimeout(() => {
				if (chatOpen || isDragging) return;
				say(null);
				setMood('idle');
			}, 350);
		};

		const handleFormInvalid = (e: Event) => {
			const custom = e as CustomEvent<{ field: 'nama' | 'telepon' | 'cart' | 'file'; message?: string }>;
			const field = custom.detail?.field ?? 'nama';
			const dialogue = getFormInvalidDialogue(field);
			setMood(dialogue.mood);
			say(custom.detail?.message || dialogue.text, dialogue.durationMs ?? 8000);
		};

		const handleFormFocus = () => {
			if (chatOpen || isDragging) return;
			setMood('writing');
			say('Silakan lengkapi formulir pemesanan ya kak, Dipi bantu catat rapi untuk antrean cetakmu~', 5000);
		};

		const handleWhatsappClicked = () => {
			setMood('phone');
			say('Menghubungkan ke WhatsApp kasir FD Printing... Mau tanya file atau konfirmasi pesanan, tim kami siap bantu!', 6000);
		};

		const handleQrisClosed = () => {
			if (chatOpen || isDragging) return;
			const dialogue = getRandomDialogue('qris_closed', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 7500);
			}
		};

		const handleOrderCancelled = () => {
			if (chatOpen || isDragging) return;
			const dialogue = getRandomDialogue('order_cancelled', bubble);
			if (dialogue) {
				setMood(dialogue.mood);
				say(dialogue.text, dialogue.durationMs ?? 8000);
			}
		};

		let themeDebounceTimer = 0;
		const handleThemeChanged = (e: Event) => {
			const custom = e as CustomEvent<{ isDark: boolean }>;
			if (chatOpen || isDragging) return;
			window.clearTimeout(themeDebounceTimer);
			themeDebounceTimer = window.setTimeout(() => {
				const isDark = custom.detail?.isDark;
				const category = isDark ? 'theme_dark' : 'theme_light';
				const dialogue = getRandomDialogue(category, bubble);
				if (dialogue) {
					setMood(dialogue.mood);
					say(dialogue.text, dialogue.durationMs ?? 5000);
				}
			}, 180);
		};

		const handleAuthInvalid = (e: Event) => {
			const custom = e as CustomEvent<{ field: 'name' | 'email' | 'password'; isSignUp?: boolean; message?: string }>;
			if (chatOpen || isDragging) return;
			const field = custom.detail?.field ?? 'email';
			const isSignUp = Boolean(custom.detail?.isSignUp);
			const dialogue = getAuthInvalidDialogue(field, isSignUp);
			setMood(dialogue.mood);
			say(custom.detail?.message || dialogue.text, dialogue.durationMs ?? 7000);
		};

		const handleAuthFailed = (e: Event) => {
			const custom = e as CustomEvent<{ reason: 'credential' | 'register' | 'general'; message?: string }>;
			if (chatOpen || isDragging) return;
			const reason = custom.detail?.reason ?? 'credential';
			const dialogue = getAuthFailedDialogue(reason, custom.detail?.message);
			setMood(dialogue.mood);
			say(dialogue.text, dialogue.durationMs ?? 8000);
		};

		const handleAuthDemo = (e: Event) => {
			const custom = e as CustomEvent<{ role: string }>;
			if (chatOpen || isDragging) return;
			const role = custom.detail?.role ?? 'Pengguna';
			setMood('celebrate');
			say(`Sip! Masuk dengan akun demo ${role}... Yuk jelajahi layanannya! 🚀`, 6500);
		};

		const handleAuthSuccess = (e: Event) => {
			const custom = e as CustomEvent<{ type: 'login' | 'register' }>;
			if (chatOpen || isDragging) return;
			const isLogin = custom.detail?.type !== 'register';
			if (isLogin) {
				setMood('celebrate');
				say('Hore, berhasil masuk! Selamat datang kembali kak! 🎉', 7000);
			} else {
				setMood('thanks');
				say('Pendaftaran berhasil! Akun siap digunakan, cek email untuk verifikasi ya~ 🎉', 7500);
			}
		};

		window.addEventListener('dipi:payment-success', handlePaymentSuccess);
		window.addEventListener('dipi:order-success', handlePaymentSuccess);
		window.addEventListener('dipi:order-waiting-payment', handleWaitingPayment);
		window.addEventListener('dipi:qris-shown', handleQrisShown);
		window.addEventListener('dipi:qris-closed', handleQrisClosed);
		window.addEventListener('dipi:order-cancelled', handleOrderCancelled);
		window.addEventListener('dipi:theme-changed', handleThemeChanged);
		window.addEventListener('dipi:auth-invalid', handleAuthInvalid);
		window.addEventListener('dipi:auth-failed', handleAuthFailed);
		window.addEventListener('dipi:auth-demo', handleAuthDemo);
		window.addEventListener('dipi:auth-success', handleAuthSuccess);
		window.addEventListener('dipi:payment-pending', handlePaymentPending);
		window.addEventListener('dipi:payment-expired', handlePaymentExpired);
		window.addEventListener('dipi:item-hover', handleItemHover);
		window.addEventListener('dipi:item-unhover', handleItemUnhover);
		window.addEventListener('dipi:form-invalid', handleFormInvalid);
		window.addEventListener('dipi:form-focus', handleFormFocus);
		window.addEventListener('dipi:whatsapp-clicked', handleWhatsappClicked);

		return () => {
			window.clearTimeout(hoverClearTimer);
			window.clearTimeout(themeDebounceTimer);
			window.removeEventListener('dipi:payment-success', handlePaymentSuccess);
			window.removeEventListener('dipi:order-success', handlePaymentSuccess);
			window.removeEventListener('dipi:order-waiting-payment', handleWaitingPayment);
			window.removeEventListener('dipi:qris-shown', handleQrisShown);
			window.removeEventListener('dipi:qris-closed', handleQrisClosed);
			window.removeEventListener('dipi:order-cancelled', handleOrderCancelled);
			window.removeEventListener('dipi:theme-changed', handleThemeChanged);
			window.removeEventListener('dipi:auth-invalid', handleAuthInvalid);
			window.removeEventListener('dipi:auth-failed', handleAuthFailed);
			window.removeEventListener('dipi:auth-demo', handleAuthDemo);
			window.removeEventListener('dipi:auth-success', handleAuthSuccess);
			window.removeEventListener('dipi:payment-pending', handlePaymentPending);
			window.removeEventListener('dipi:payment-expired', handlePaymentExpired);
			window.removeEventListener('dipi:item-hover', handleItemHover);
			window.removeEventListener('dipi:item-unhover', handleItemUnhover);
			window.removeEventListener('dipi:form-invalid', handleFormInvalid);
			window.removeEventListener('dipi:form-focus', handleFormFocus);
			window.removeEventListener('dipi:whatsapp-clicked', handleWhatsappClicked);
		};
	});

	const poseSrc = $derived(POSE[mood]);
	// pose peek/surprised/point di-mirror saat dock kanan agar menghadap konten
	const mirrored = $derived(
		dock === 'right' && (mood === 'peek' || mood === 'surprised' || mood === 'point')
	);
	const showBelow = $derived(posY !== null && posY < 170);
</script>

<svelte:window onpointermove={onWindowPointerMove} />

<!-- panel chat -->
{#if chatOpen}
	<DipiChat
		onClose={() => (chatOpen = false)}
		onMood={setMood}
		dockSide={dock}
		offsetBottom={posY !== null ? Math.max(16, (typeof window !== 'undefined' ? window.innerHeight : 800) - posY - 100) : offsetY}
	/>
{/if}

<!-- widget floating (bebas digeser ke mana pun di layar oleh pengguna) -->
<div
	bind:this={wrapEl}
	class="dipi-float fixed z-[90] select-none"
	class:left-3.5={posX === null && dock === 'left'}
	class:sm:left-5={posX === null && dock === 'left'}
	class:right-3.5={posX === null && dock === 'right'}
	class:sm:right-5={posX === null && dock === 'right'}
	class:max-sm:hidden={chatOpen}
	style={posX !== null && posY !== null
		? `left: ${posX}px; top: ${posY}px; bottom: auto; right: auto;`
		: `bottom: ${offsetY}px;`}
	role="presentation"
>
	<!-- balon ucapan adaptif (sembunyikan saat chat terbuka) -->
	{#if bubble && !chatOpen}
		<div
			class="dipi-bubble absolute w-48 sm:w-64 rounded-2xl border border-slate-200/90 bg-white/95 p-2.5 sm:p-3 text-[11px] sm:text-[13px] leading-relaxed text-slate-700 shadow-xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-200 pointer-events-auto"
			class:bottom-full={!showBelow}
			class:mb-3={!showBelow}
			class:top-full={showBelow}
			class:mt-3={showBelow}
			class:left-0={dock === 'left'}
			class:rounded-bl-xs={dock === 'left' && !showBelow}
			class:rounded-tl-xs={dock === 'left' && showBelow}
			class:right-0={dock === 'right'}
			class:rounded-br-xs={dock === 'right' && !showBelow}
			class:rounded-tr-xs={dock === 'right' && showBelow}
		>
			<p class="font-medium text-slate-800 dark:text-slate-100">{bubble}</p>
			<!-- panah tail balon ucapan -->
			{#if showBelow}
				<div
					class="absolute -top-1.5 h-3 w-3 rotate-45 border-t border-l border-slate-200/90 bg-white dark:border-slate-700/80 dark:bg-slate-900"
					class:left-6={dock === 'left'}
					class:right-6={dock === 'right'}
				></div>
			{:else}
				<div
					class="absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-slate-200/90 bg-white dark:border-slate-700/80 dark:bg-slate-900"
					class:left-6={dock === 'left'}
					class:right-6={dock === 'right'}
				></div>
			{/if}
		</div>
	{/if}

	<!-- gelembung Zzz saat tidur (sembunyikan saat chat terbuka) -->
	{#if mood === 'sleep' && !chatOpen}
		<div class="pointer-events-none absolute -top-2 left-6 flex gap-1 text-slate-400 dark:text-slate-500" aria-hidden="true">
			<span class="dipi-zzz text-sm font-bold">z</span>
			<span class="dipi-zzz dipi-zzz-2 text-base font-bold">z</span>
			<span class="dipi-zzz dipi-zzz-3 text-lg font-bold">z</span>
		</div>
	{/if}

	<button
		type="button"
		aria-label="Buka chat Dipi, asisten FD Printing (Dapat digeser bebas)"
		class="dipi-mascot relative flex items-end justify-center cursor-grab active:cursor-grabbing touch-none transition-transform duration-150 hover:scale-105 active:scale-95"
		class:cursor-grabbing={isDragging}
		class:dipi-dragging={isDragging}
		onpointerdown={onPointerDown}
		onclick={onMascotClick}
	>
		<span
			class="dipi-mascot-inner block will-change-transform"
			style:transform="translate3d({px.toFixed(1)}px, {py.toFixed(1)}px, 0) rotate({prot.toFixed(1)}deg) {mirrored
				? 'scaleX(-1)'
				: ''}"
		>
			<img
				src={poseSrc}
				alt="Dipi, maskot AI FD Digital Printing"
				class="pointer-events-none h-24 sm:h-36 md:h-40 w-auto max-w-[92px] sm:max-w-[135px] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.22)]"
				draggable="false"
			/>
		</span>
		<!-- halo status AI -->
		<span
			class="pointer-events-none absolute -bottom-1 left-1/2 h-2.5 w-12 sm:w-16 -translate-x-1/2 rounded-full bg-cyan-400/40 blur-md dark:bg-cyan-400/30"
			aria-hidden="true"
		></span>
	</button>
</div>

<style>
	/* melayang santai (nonaktif saat drag / reduced motion) */
	.dipi-float:not(.dipi-dragging) .dipi-mascot-inner {
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
