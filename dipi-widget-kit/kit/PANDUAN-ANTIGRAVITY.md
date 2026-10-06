# Panduan Antigravity — Pasang Widget "Dipi"

File ini berisi DUA bagian:
- **Bagian A:** prompt siap-paste ke Antigravity (copy seluruh blok kode di bawah)
- **Bagian B:** contoh penggunaan kode (referensi cepat)

Aset gambar (11 pose WebP transparan) ada di folder `kit/assets/`,
kode di `kit/code/`, cara pasang detail di `kit/README.md`.

---

## BAGIAN A — PROMPT SIAP-PASTE

Copy blok di bawah ini mentah-mentah ke Antigravity:

```text
Konteks proyek: FD Digital Printing — SvelteKit + Svelte 5 (runes) +
TypeScript + Tailwind v4 + lucide-svelte. Repo ini sudah jalan di
https://fd-printing.sir-l.web.id.

Tugas: pasang maskot AI floating "Dipi" (karakter chibi percetakan,
11 pose WebP transparan) sebagai AI Web Copilot di halaman publik.

FILE YANG TERSEDIA (sudah disiapkan, tinggal copy):
1. kit/assets/*.webp (11 file: dipi-idle, sit, wave, thinking, happy,
   celebrate, confused, point, surprised, sleep, peek)
   → copy ke static/dipi/
2. kit/code/dipiSensory.ts → copy ke src/lib/dipi/dipiSensory.ts
   (mesin perilaku: AFK→sleep, rage-click→surprised, exit-intent,
   copy→happy, visibilitychange; pure TS, tanpa dependensi)
3. kit/code/DipiWidget.svelte → copy ke src/lib/dipi/DipiWidget.svelte
   (widget floating: parallax mouse, drag + snap tepi kiri/kanan,
   balon ucapan kontekstual per route, default dock KIRI BAWAH agar
   tidak tabrakan tombol WA floating kanan-bawah)
4. kit/code/DipiChat.svelte → copy ke src/lib/dipi/DipiChat.svelte
   (panel chat + mock brain lokal; POST ke /api/ai/assistant,
   fallback mock jika API belum siap)
5. kit/code/api-assistant-server.ts → copy menjadi
   src/routes/api/ai/assistant/+server.ts
   (STATUS SKELETON + mock: JANGAN dihapus mock-nya sebelum
   nine-router tersambung. Ikuti TODO di file untuk menyambung
   ke https://mj9.sir-l.web.id/v1 dengan tool-calling:
   kalkulasi_cetak, cek_status_order, info_toko)

LANGKAH IMPLEMENTASI:
1. Copy semua file sesuai peta di atas (jangan ubah nama file aset).
2. Mount widget di src/routes/+layout.svelte:
   <script>import DipiWidget from '$lib/dipi/DipiWidget.svelte';</script>
   <DipiWidget />
   Sembunyikan di route internal (kasir/dashboard):
   {#if !['/kasir','/dashboard','/order','/laporan'].some(p =>
     $page.url.pathname.startsWith(p))} <DipiWidget /> {/if}
   (import { page } from '$app/state')
3. Di halaman sukses order (/pesan/sukses/[code]), dispatch event agar
   Dipi selebrasi:
   window.dispatchEvent(new CustomEvent('dipi:order-success'));
4. Verifikasi: bun run check && bun run build lolos tanpa error,
   widget muncul di landing, bisa di-drag + snap ke tepi, klik membuka
   chat, chat mock merespons ("jam buka toko" → jawaban benar).

BATASAN:
- Jangan ubah file di luar scope di atas kecuali untuk mount layout.
- Jangan hardcode API key apa pun. Key nine-router HANYA di env server.
- Jangan hapus mock brain sebelum backend nine-router live & dites.
- Teks UI Bahasa Indonesia kasual, tanpa emoji di widget (aturan anti-slop);
  Lucide untuk ikon.
```

---

## BAGIAN B — CONTOH PENGGUNAAN KODE

### 1. Mount dasar (semua halaman)

```svelte
<!-- src/routes/+layout.svelte -->
<script>
	import DipiWidget from '$lib/dipi/DipiWidget.svelte';
</script>

<DipiWidget />
<slot />
```

### 2. Hanya halaman publik (sembunyikan di area internal)

```svelte
<script>
	import { page } from '$app/state';
	import DipiWidget from '$lib/dipi/DipiWidget.svelte';

	const internal = $derived(
		['/kasir', '/dashboard', '/order', '/laporan', '/piutang', '/pengaturan'].some((p) =>
			page.url.pathname.startsWith(p)
		)
	);
</script>

{#if !internal}
	<DipiWidget />
{/if}
```

### 3. Bikin Dipi selebrasi saat order sukses

```ts
// di halaman /pesan/sukses/[code], setelah order terkonfirmasi:
window.dispatchEvent(new CustomEvent('dipi:order-success'));
// → pose celebrate + balon "Yess! QRIS siap di-scan..."
```

### 4. Chat API — format request/response

```ts
// POST /api/ai/assistant
// request:  { "message": "banner 2x1 berapa?" }
// response: {
//   "reply": "Estimasi Rp ...",
//   "mood": "happy",              // idle|thinking|happy|celebrate|confused|surprised
//   "cards": [                   // kartu interaktif di chat (opsional)
//     { "kind": "price", "title": "Banner 2x1 m",
//       "rows": [{ "label": "Luas", "value": "2 m²" }],
//       "note": "..." }
//   ]
// }
```

### 5. Pakai sensory engine di komponen lain (opsional)

```ts
import { DipiSensory } from '$lib/dipi/dipiSensory';

const sensory = new DipiSensory({
	onMood: (m) => console.log('mood:', m), // idle|sit|wave|...|peek
	onSay: (text, ms) => console.log('dipi bilang:', text)
});
// ...
sensory.destroy(); // saat komponen unmount
```

### 6. Daftar pose & pemicu

| Pose | File | Dipakai saat |
|---|---|---|
| idle | dipi-idle.webp | default floating |
| sit | dipi-sit.webp | idle lama (bengong 25 dtk) |
| wave | dipi-wave.webp | mount, kembali dari tab |
| thinking | dipi-thinking.webp | chat loading |
| happy | dipi-happy.webp | copy teks, easter egg klik 5x |
| celebrate | dipi-celebrate.webp | order/QRIS sukses |
| confused | dipi-confused.webp | AI tidak paham |
| point | dipi-point.webp | mengarahkan ke konten |
| surprised | dipi-surprised.webp | rage-click, exit intent |
| sleep | dipi-sleep.webp | AFK 60 dtk (+Zzz dari CSS) |
| peek | dipi-peek.webp | habis drag / dock tepi |
