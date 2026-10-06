# Kit Widget "Dipi" — AI Floating Assistant FD Digital Printing

Isi kit:

- `assets/` — 11 pose WebP transparan (±512px, total ±450KB)
- `code/dipiSensory.ts` — mesin perilaku (AFK, rage-click, exit intent, copy, visibility)
- `code/DipiWidget.svelte` — widget floating: parallax mouse, drag + snap tepi, balon ucapan, pose reaktif
- `code/DipiChat.svelte` — panel chat + mock brain (jalan tanpa backend)
- `code/api-assistant-server.ts` — skeleton `POST /api/ai/assistant` + tool schemas + TODO nine-router

## Cara pasang (5 langkah)

### 1. Aset

Copy seluruh isi `assets/` ke:

```
static/dipi/
```

### 2. Kode widget

Copy ke:

```
src/lib/dipi/dipiSensory.ts
src/lib/dipi/DipiWidget.svelte
src/lib/dipi/DipiChat.svelte
```

Butuh `lucide-svelte` (sudah dipakai proyek ini).

### 3. Backend (opsional tahap 1)

Copy `code/api-assistant-server.ts` menjadi:

```
src/routes/api/ai/assistant/+server.ts
```

Tanpa backend pun chat tetap jalan via mock brain lokal.

### 4. Mount di layout

Di `src/routes/+layout.svelte` (atau layout grup publik):

```svelte
<script>
	import DipiWidget from '$lib/dipi/DipiWidget.svelte';
	// ... script lain
</script>

<DipiWidget />
<!-- ... markup lain -->
```

Saran: tampilkan hanya di halaman publik (landing, produk, pesan).
Contoh sembunyikan di area kasir internal:

```svelte
{#if !$page.url.pathname.startsWith('/kasir')}
	<DipiWidget />
{/if}
```

### 5. Event integrasi (opsional)

Dari halaman sukses order, bikin Dipi selebrasi:

```ts
window.dispatchEvent(new CustomEvent('dipi:order-success'));
```

## Catatan penting

- **Konflik tombol WA:** web ini punya tombol WA floating kanan-bawah,
  jadi default dock Dipi = **kiri bawah**. User tetap bisa drag ke mana saja.
- **Pose di-mirror otomatis** (CSS `scaleX`) saat dock kanan untuk pose
  `peek`/`surprised` agar menghadap konten.
- **Aksesibilitas:** `prefers-reduced-motion` didukung (animasi mati otomatis).
- **Performa:** 8 pose di-preload saat mount; total ±320KB.
- **Keamanan API:** endpoint skeleton wajib diberi rate-limit sebelum
  disambung ke nine-router. Jangan teruskan API key ke browser.

## Peta pose → state

| State | Pose | Pemicu |
|---|---|---|
| default floating | idle / sit | — |
| dock tepi | peek | habis drag |
| sapa | wave | mount, balik dari tab |
| AI mikir | thinking | chat loading |
| sukses | happy | copy teks, easter egg klik 5x |
| order/QRIS sukses | celebrate | event `dipi:order-success` |
| AI tidak paham | confused | chat fallback |
| arahkan ke konten | point | manual / tool navigasi |
| kaget | surprised | rage-click, exit intent |
| AFK | sleep | 60 dtk tanpa interaksi (+Zzz CSS) |

## Yang masih kurang (roadmap)

1. **Sambung `/api/ai/assistant` ke nine-router** (tool-calling beneran) —
   skeleton + schemas sudah disiapkan, tinggal isi TODO.
2. **Sumber tarif publik** untuk `kalkulasi_cetak` (baca dari DB/tabel harga,
   min. luas 1 m² seperti kalkulator web).
3. **Rate-limit** endpoint lacak order (by kode saja, jangan bocor data lain).
