<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		Activity,
		AlertCircle,
		Bot,
		CheckCircle2,
		Database,
		GitMerge,
		HardDrive,
		MessageCircle,
		Pin,
		Plus,
		QrCode,
		RefreshCw,
		Send,
		ShieldCheck,
		Trash2,
		Upload,
		Users
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import { cn } from '#lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let tabAktif = $state<'semua' | 'telegram' | 'qris' | 'devops' | 'wa'>('semua');
	let uploading = $state(false);
	let deleting = $state(false);
	let savingTelegram = $state(false);
	let testingTarget = $state<string | null>(null);
	let syncingCommands = $state(false);
	let backingUpDb = $state(false);
	let savingHeartbeat = $state(false);
	let pingingHeartbeat = $state(false);

	function initStaff() {
		return data.telegram.staffList && data.telegram.staffList.length > 0
			? [...data.telegram.staffList]
			: data.telegram.adminIds.map((id, i) => ({
					id,
					name: i === 0 ? 'Owner Utama' : `Staf #${i + 1}`,
					role: (i === 0 ? 'owner' : 'kasir') as 'owner' | 'kasir' | 'operator'
				}));
	}

	let staffList = $state<Array<{ id: string; name: string; role: 'owner' | 'kasir' | 'operator' }>>([]);

	$effect(() => {
		staffList = initStaff();
	});

	let newStaffId = $state('');
	let newStaffName = $state('');
	let newStaffRole = $state<'owner' | 'kasir' | 'operator'>('kasir');

	function tambahStaf() {
		const trimmedId = newStaffId.trim();
		const trimmedName = newStaffName.trim() || 'Staf';
		if (!trimmedId || !/^-?\d+$/.test(trimmedId)) {
			toast.error('ID Telegram harus berupa angka.');
			return;
		}
		if (staffList.some((s) => s.id === trimmedId)) {
			toast.error('ID Telegram ini sudah ada di daftar staf.');
			return;
		}
		staffList = [...staffList, { id: trimmedId, name: trimmedName, role: newStaffRole }];
		newStaffId = '';
		newStaffName = '';
		toast.success(`Staf "${trimmedName}" berhasil ditambahkan.`);
	}

	function hapusStaf(id: string) {
		staffList = staffList.filter((s) => s.id !== id);
	}

	function hasilSinkron() {
		return () => {
			syncingCommands = true;
			return async ({ result }: { result: any }) => {
				syncingCommands = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Menu keyboard bot (/) berhasil disinkronkan!');
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal sinkronisasi menu bot.'));
				}
			};
		};
	}

	function hasil(aksi: string) {
		return () => {
			if (aksi === 'upload') uploading = true;
			else deleting = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				uploading = false;
				deleting = false;
				if (result.type === 'success') {
					toast.success(aksi === 'upload' ? 'Gambar QRIS tersimpan.' : 'Gambar QRIS dihapus.');
					await update();
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal memproses.'));
				}
			};
		};
	}

	function hasilTelegram() {
		return () => {
			savingTelegram = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				savingTelegram = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Pengaturan Telegram berhasil disimpan.');
					await update();
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal menyimpan pengaturan.'));
				}
			};
		};
	}

	function hasilUji(target: string) {
		return () => {
			testingTarget = target;
			return async ({ result }: { result: any }) => {
				testingTarget = null;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Pesan uji coba berhasil terkirim!');
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Uji coba gagal.'));
				}
			};
		};
	}

	function hasilBackup() {
		return () => {
			backingUpDb = true;
			return async ({ result }: { result: any }) => {
				backingUpDb = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Snapshot database berhasil dikirim ke Telegram Owner!');
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal membuat backup database.'));
				}
			};
		};
	}

	function hasilSimpanHeartbeat() {
		return () => {
			savingHeartbeat = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				savingHeartbeat = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'URL Heartbeat berhasil disimpan.');
					await update();
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal menyimpan URL Heartbeat.'));
				}
			};
		};
	}

	function hasilUjiHeartbeat() {
		return () => {
			pingingHeartbeat = true;
			return async ({ result }: { result: any }) => {
				pingingHeartbeat = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Ping heartbeat sukses terkirim!');
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal mengirim ping heartbeat.'));
				}
			};
		};
	}

	/* ---------------- WhatsApp & AI Brain Reactive State ---------------- */
	let waLiveStatus = $state<{
		provider: string;
		connected: boolean;
		detail: string;
		qrDataUrl?: string;
		pairingCode?: string;
		botNumber?: string;
	}>({
		provider: 'off',
		connected: false,
		detail: ''
	});

	let pollingInterval: any = null;
	let waConnecting = $state(false);
	let waDisconnecting = $state(false);
	let pairingPhone = $state('');
	let requestingPairing = $state(false);
	let pairingCodeResult = $state('');
	let savingAi = $state(false);

	$effect(() => {
		waLiveStatus = {
			provider: (data as any).waProvider ?? 'off',
			connected: (data as any).wa?.connected ?? false,
			detail: (data as any).wa?.detail ?? '',
			qrDataUrl: (data as any).waQrDataUrl,
			pairingCode: (data as any).waPairingCode,
			botNumber: (data as any).waBotNumber
		};
		pairingCodeResult = (data as any).waPairingCode || '';
	});

	async function pollWaStatus() {
		try {
			const res = await fetch('/api/wa/status');
			if (res.ok) {
				const json = await res.json();
				waLiveStatus = json;
				if (json.pairingCode) {
					pairingCodeResult = json.pairingCode;
				}
			}
		} catch {}
	}

	$effect(() => {
		if (tabAktif === 'wa' || tabAktif === 'semua') {
			pollWaStatus();
			pollingInterval = setInterval(pollWaStatus, 3500);
			return () => {
				if (pollingInterval) clearInterval(pollingInterval);
			};
		} else {
			if (pollingInterval) clearInterval(pollingInterval);
		}
	});

	function hasilWaConnect() {
		return () => {
			waConnecting = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				waConnecting = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Koneksi Baileys dimulai!');
					await update();
					await pollWaStatus();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal memulai koneksi.'));
				}
			};
		};
	}

	function hasilWaDisconnect() {
		return () => {
			waDisconnecting = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				waDisconnecting = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'WhatsApp diputuskan.');
					pairingCodeResult = '';
					await update();
					await pollWaStatus();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal memutuskan WhatsApp.'));
				}
			};
		};
	}

	function hasilPairingCode() {
		return () => {
			requestingPairing = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				requestingPairing = false;
				if (result.type === 'success') {
					toast.success('Kode Pairing berhasil dibuat!');
					if (result.data?.pairingCode) {
						pairingCodeResult = result.data.pairingCode;
					}
					await update();
					await pollWaStatus();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal meminta kode pairing.'));
				}
			};
		};
	}

	function hasilAiGateway() {
		return () => {
			savingAi = true;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				savingAi = false;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Pengaturan AI Gateway berhasil disimpan!');
					await update();
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(String(result.data?.message ?? 'Gagal menyimpan AI Gateway.'));
				}
			};
		};
	}
</script>

<PageHeader title="Pengaturan Toko" description="Pengaturan QRIS, integrasi Telegram & Komunitas, dan WhatsApp." />

<!-- Tab Navigasi Kategori Pengaturan -->
<div class="mb-6 flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3 dark:border-slate-800">
	<button
		type="button"
		onclick={() => (tabAktif = 'semua')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
			tabAktif === 'semua'
				? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
				: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
		)}
	>
		🌐 Semua
	</button>
	<button
		type="button"
		onclick={() => (tabAktif = 'telegram')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
			tabAktif === 'telegram'
				? 'bg-blue-600 text-white shadow-xs'
				: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
		)}
	>
		<Bot class="h-3.5 w-3.5" /> Telegram Bot & Tim
	</button>
	<button
		type="button"
		onclick={() => (tabAktif = 'qris')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
			tabAktif === 'qris'
				? 'bg-emerald-600 text-white shadow-xs'
				: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
		)}
	>
		<QrCode class="h-3.5 w-3.5" /> QRIS Toko
	</button>
	<button
		type="button"
		onclick={() => (tabAktif = 'devops')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
			tabAktif === 'devops'
				? 'bg-purple-600 text-white shadow-xs'
				: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
		)}
	>
		<HardDrive class="h-3.5 w-3.5" /> DevOps & Backup
	</button>
	<button
		type="button"
		onclick={() => (tabAktif = 'wa')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer',
			tabAktif === 'wa'
				? 'bg-green-600 text-white shadow-xs'
				: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
		)}
	>
		<MessageCircle class="h-3.5 w-3.5" /> WhatsApp Gateway
	</button>
</div>

<div class={tabAktif === 'semua' ? 'grid grid-cols-1 gap-6 lg:grid-cols-2' : 'max-w-3xl space-y-6'}>
	<!-- KOLOM KIRI: TELEGRAM & KOMUNITAS TOKO -->
	{#if tabAktif === 'semua' || tabAktif === 'telegram'}
	<div class="space-y-6">
		<section class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<h2 class="flex items-center gap-2 text-sm font-bold text-slate-900">
					<Bot class="h-4 w-4 text-blue-600" /> Telegram & Komunitas Toko
				</h2>
				<span
					class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold {data.botActive
						? 'bg-green-50 text-green-700 border border-green-200'
						: 'bg-amber-50 text-amber-700 border border-amber-200'}"
				>
					{#if data.botActive}
						<CheckCircle2 class="h-3 w-3" /> Bot Aktif
					{:else}
						<AlertCircle class="h-3 w-3" /> Token Belum Ada
					{/if}
				</span>
			</div>

			<p class="mt-2 text-xs text-slate-500">
				Kelola multi-admin, grup tim kerja, dan channel pelanggan secara dinamis langsung dari web tanpa perlu
				membuka terminal VPS.
			</p>

			<form method="POST" action="?/simpanTelegram" use:enhance={hasilTelegram()} class="mt-4 space-y-4">
				<!-- Hidden JSON Data Staf -->
				<input type="hidden" name="staffJson" value={JSON.stringify(staffList)} />
				<input
					type="hidden"
					name="adminIds"
					value={staffList.filter((s) => s.role === 'owner' || s.role === 'kasir').map((s) => s.id).join(',')}
				/>

				<!-- Manajemen Multi-Staf & Role Telegram -->
				<div class="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
					<div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
						<div>
							<h3 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
								<Users class="h-3.5 w-3.5 text-brand-600" />
								Daftar Staf Telegram & Hak Akses
							</h3>
							<p class="text-[11px] text-slate-500 mt-0.5">
								Bisa lebih dari 1 orang per role. Operator hanya melihat antrean cetak tanpa akses omzet.
							</p>
						</div>
						<span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
							{staffList.length} Staf
						</span>
					</div>

					<!-- List Staf Terdaftar -->
					<div class="mt-3 divide-y divide-slate-100">
						{#if staffList.length === 0}
							<p class="py-3 text-center text-xs text-slate-400">Belum ada staf terdaftar. Tambahkan di bawah.</p>
						{:else}
							{#each staffList as staff (staff.id)}
								<div class="flex items-center justify-between py-2 text-xs">
									<div class="flex items-center gap-2">
										<span class="font-medium text-slate-900">{staff.name}</span>
										<code class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
											{staff.id}
										</code>
										{#if staff.role === 'owner'}
											<Badge variant="brand" class="text-[10px] py-0 px-1.5">👑 Owner</Badge>
										{:else if staff.role === 'kasir'}
											<Badge variant="success" class="text-[10px] py-0 px-1.5">💼 Kasir</Badge>
										{:else}
											<Badge variant="default" class="text-[10px] py-0 px-1.5">⚙️ Operator</Badge>
										{/if}
									</div>

									<button
										type="button"
										onclick={() => hapusStaf(staff.id)}
										class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
										title="Hapus staf"
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								</div>
							{/each}
						{/if}
					</div>

					<!-- Form Tambah Staf Baru -->
					<div class="mt-3.5 border-t border-dashed border-slate-200 pt-3">
						<p class="text-[11px] font-semibold text-slate-700 mb-2">Tambah Staf Baru:</p>
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-12">
							<div class="sm:col-span-4">
								<input
									type="text"
									bind:value={newStaffId}
									placeholder="ID Telegram (angka)"
									class="h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 font-mono text-xs text-slate-900 outline-none focus:border-brand-600"
								/>
							</div>
							<div class="sm:col-span-4">
								<input
									type="text"
									bind:value={newStaffName}
									placeholder="Nama Staf (contoh: Kasir Siti)"
									class="h-8 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-brand-600"
								/>
							</div>
							<div class="sm:col-span-3">
								<select
									bind:value={newStaffRole}
									class="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900 outline-none focus:border-brand-600"
								>
									<option value="kasir">💼 Kasir</option>
									<option value="operator">⚙️ Operator Cetak</option>
									<option value="owner">👑 Owner</option>
								</select>
							</div>
							<div class="sm:col-span-1">
								<button
									type="button"
									onclick={tambahStaf}
									class="flex h-8 w-full items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
									title="Tambah Staf"
								>
									<Plus class="h-4 w-4" />
								</button>
							</div>
						</div>
						<p class="mt-1.5 text-[10px] text-slate-400">
							Dapatkan ID dengan meminta staf mengetik <code>/id</code> ke bot <b>@FD_printing_bot</b>.
						</p>
					</div>
				</div>

				<!-- Grup Tim Internal -->
				<div>
					<Label for="adminGroupId" class="flex items-center justify-between">
						<span>ID Grup Tim Internal (Staf & Operator)</span>
						<span class="text-[11px] font-normal text-slate-400">Diawali tanda minus (-)</span>
					</Label>
					<input
						id="adminGroupId"
						name="adminGroupId"
						type="text"
						value={data.telegram.adminGroupId}
						placeholder="-100xxxxxxxxxx"
						class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 shadow-xs outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
					/>
					<p class="mt-1 text-[11px] text-slate-500">
						Grup koordinasi staf. Notifikasi pesanan baru masuk ke sini lengkap dengan tombol proses/selesai.
					</p>
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<!-- Channel Publik Pelanggan -->
					<div>
						<Label for="publicChannelId">Channel Etalase Publik</Label>
						<input
							id="publicChannelId"
							name="publicChannelId"
							type="text"
							value={data.telegram.publicChannelId}
							placeholder="@fd_digitalprinting"
							class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-xs outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
						/>
						<p class="mt-1 text-[10px] text-slate-400">Username atau ID Channel</p>
					</div>

					<!-- Grup Diskusi / Komentar -->
					<div>
						<Label for="discussionGroupId">Grup Diskusi (Komentar)</Label>
						<input
							id="discussionGroupId"
							name="discussionGroupId"
							type="text"
							value={data.telegram.discussionGroupId}
							placeholder="-100xxxxxxxxxx"
							class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 shadow-xs outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
						/>
						<p class="mt-1 text-[10px] text-slate-400">Grup tertaut channel pembeli</p>
					</div>
				</div>

				<!-- Saklar Fitur Otomatis -->
				<div class="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
					<p class="text-xs font-semibold text-slate-800">Fitur Otomatis Bot:</p>

					<label class="flex items-start gap-2.5 cursor-pointer">
						<input
							type="checkbox"
							name="featureGroupButtons"
							checked={data.telegram.featureGroupButtons}
							class="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
						/>
						<div class="text-xs">
							<span class="font-medium text-slate-800">Tombol Aksi Cepat Pesanan di Grup Tim</span>
							<p class="text-[11px] text-slate-500">Sertakan tombol ⚙️ Proses & ✅ Selesai di notifikasi grup.</p>
						</div>
					</label>

					<label class="flex items-start gap-2.5 cursor-pointer">
						<input
							type="checkbox"
							name="featureAutoPin"
							checked={data.telegram.featureAutoPin}
							class="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
						/>
						<div class="text-xs">
							<span class="font-medium text-slate-800">Auto-Pin Pesanan Mendesak / Hari Ini</span>
							<p class="text-[11px] text-slate-500">Sematkan otomatis order yang memiliki batas janji hari ini.</p>
						</div>
					</label>

					<label class="flex items-start gap-2.5 cursor-pointer">
						<input
							type="checkbox"
							name="featureAutoWelcome"
							checked={data.telegram.featureAutoWelcome}
							class="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
						/>
						<div class="text-xs">
							<span class="font-medium text-slate-800">Auto-Welcome Pembeli Baru</span>
							<p class="text-[11px] text-slate-500">Sapa ramah anggota yang baru bergabung ke grup diskusi.</p>
						</div>
					</label>
				</div>

				<!-- Template Welcome Text -->
				<div>
					<Label for="welcomeText" class="flex items-center justify-between">
						<span>Pesan Sapaan Selamat Datang (Grup Diskusi)</span>
						<span class="text-[11px] font-normal text-slate-400">Variabel: {'{name}'}</span>
					</Label>
					<textarea
						id="welcomeText"
						name="welcomeText"
						rows="2"
						class="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 shadow-xs outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
					>{data.telegram.welcomeText}</textarea>
				</div>

				<!-- Integrasi GitHub ChatOps (Merge dev -> main via Telegram) -->
				<div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
								<GitMerge class="h-3.5 w-3.5 text-brand-600" />
								Integrasi GitHub ChatOps (Merge via Telegram)
							</h3>
							<p class="text-[11px] text-slate-500 mt-0.5">
								Memungkinkan Owner mengetik <code>/rilis</code> di bot Telegram untuk merge branch <code>dev</code> ke <code>main</code> dan deploy otomatis.
							</p>
						</div>
						{#if data.github.token}
							<Badge variant="success" class="text-[10px] py-0 px-1.5">Terhubung</Badge>
						{:else}
							<Badge variant="default" class="text-[10px] py-0 px-1.5">Belum Diset</Badge>
						{/if}
					</div>

					<div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
						<div>
							<Label for="githubToken" class="text-xs">GitHub Personal Access Token (PAT)</Label>
							<input
								id="githubToken"
								name="githubToken"
								type="password"
								defaultValue={data.github.token}
								placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
								class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-brand-600"
							/>
							<p class="mt-1 text-[10px] text-slate-400">Token dengan izin <code>Contents: Read & Write</code></p>
						</div>

						<div>
							<Label for="githubRepo" class="text-xs">Nama Repositori GitHub</Label>
							<input
								id="githubRepo"
								name="githubRepo"
								type="text"
								defaultValue={data.github.repo}
								placeholder="username/nama-repo"
								class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-brand-600"
							/>
							<p class="mt-1 text-[10px] text-slate-400">Contoh: <code>itzluthfi/fd-digital-printing</code></p>
						</div>
					</div>
				</div>

				<div class="flex flex-col sm:flex-row sm:items-center gap-2 pt-2">
					<Button type="submit" disabled={savingTelegram} class="w-full sm:w-auto">
						{savingTelegram ? 'Menyimpan…' : 'Simpan Pengaturan Telegram'}
					</Button>
				</div>
			</form>

			<!-- Panel Sinkronisasi Menu Slash Keyboard Bot -->
			<div class="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
				<div>
					<p class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
						<RefreshCw class="h-3.5 w-3.5 text-brand-600" />
						Sinkronisasi Menu Keyboard Bot (Perintah Slash /)
					</p>
					<p class="text-[11px] text-slate-500 mt-0.5">
						Mendaftarkan menu cepat ke Telegram API sesuai hak akses (Owner, Kasir, Operator, & Grup Pelanggan).
					</p>
				</div>

				<form method="POST" action="?/sinkronMenuBot" use:enhance={hasilSinkron()}>
					<Button
						type="submit"
						variant="outline"
						size="sm"
						disabled={syncingCommands || !data.botActive}
						class="text-xs font-semibold whitespace-nowrap"
					>
						<RefreshCw class="h-3.5 w-3.5 mr-1.5 {syncingCommands ? 'animate-spin text-brand-600' : ''}" />
						{syncingCommands ? 'Menyinkronkan…' : 'Sinkronkan Menu Bot (/) Sekarang'}
					</Button>
				</form>
			</div>

			<!-- Panel Uji Coba Koneksi -->
			<div class="mt-6 border-t border-slate-100 pt-4">
				<h3 class="text-xs font-bold text-slate-900">Uji Coba Pengiriman Pesan</h3>
				<p class="mt-0.5 text-[11px] text-slate-500">
					Kirim pesan uji coba untuk memastikan ID benar dan bot sudah memiliki izin kirim pesan.
				</p>

				<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
					<form method="POST" action="?/ujiKirimTelegram" use:enhance={hasilUji('admin')}>
						<input type="hidden" name="target" value="admin" />
						<Button
							type="submit"
							variant="outline"
							size="sm"
							disabled={testingTarget === 'admin' || data.telegram.adminIds.length === 0}
							class="w-full text-[11px]"
						>
							<Send class="h-3 w-3" /> {testingTarget === 'admin' ? 'Menguji…' : 'Tes Admin'}
						</Button>
					</form>

					<form method="POST" action="?/ujiKirimTelegram" use:enhance={hasilUji('grup_tim')}>
						<input type="hidden" name="target" value="grup_tim" />
						<Button
							type="submit"
							variant="outline"
							size="sm"
							disabled={testingTarget === 'grup_tim' || !data.telegram.adminGroupId}
							class="w-full text-[11px]"
						>
							<Users class="h-3 w-3" /> {testingTarget === 'grup_tim' ? 'Menguji…' : 'Tes Grup Tim'}
						</Button>
					</form>

					<form method="POST" action="?/ujiKirimTelegram" use:enhance={hasilUji('channel')}>
						<input type="hidden" name="target" value="channel" />
						<Button
							type="submit"
							variant="outline"
							size="sm"
							disabled={testingTarget === 'channel' || !data.telegram.publicChannelId}
							class="w-full text-[11px]"
						>
							<Bot class="h-3 w-3" /> {testingTarget === 'channel' ? 'Menguji…' : 'Tes Channel'}
						</Button>
					</form>

					<form method="POST" action="?/ujiKirimTelegram" use:enhance={hasilUji('grup_diskusi')}>
						<input type="hidden" name="target" value="grup_diskusi" />
						<Button
							type="submit"
							variant="outline"
							size="sm"
							disabled={testingTarget === 'grup_diskusi' || !data.telegram.discussionGroupId}
							class="w-full text-[11px]"
						>
							<MessageCircle class="h-3 w-3" /> {testingTarget === 'grup_diskusi' ? 'Menguji…' : 'Tes Diskusi'}
						</Button>
					</form>
				</div>
			</div>
		</section>
	</div>
	{/if}

	<!-- KOLOM KANAN: QRIS, WHATSAPP & DEVOPS -->
	{#if tabAktif === 'semua' || tabAktif === 'qris' || tabAktif === 'devops' || tabAktif === 'wa'}
	<div class="space-y-6">
		{#if tabAktif === 'semua' || tabAktif === 'qris'}
		<!-- QRIS Toko -->
		<section class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
			<h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900">
				<QrCode class="h-4 w-4 text-brand-700" /> QRIS Toko
			</h2>
			<p class="mt-1 text-xs text-slate-500">
				Gambar QRIS statis yang tampil di kasir saat metode bayar QRIS dipilih, dan di halaman invoice cetak.
				Format PNG/JPG, maksimal 2 MB.
			</p>

			{#if data.qrisAda}
				<div class="mt-4 flex flex-col items-center gap-3">
					<img
						src="{data.qrisUrl}?v={Date.now()}"
						alt="QRIS FD Digital Printing"
						class="h-44 w-44 rounded-md border border-slate-200 object-contain p-1"
					/>
					<form method="POST" action="?/hapusQris" use:enhance={hasil('hapus')}>
						<Button type="submit" variant="outline" size="sm" disabled={deleting}>
							<Trash2 class="h-3.5 w-3.5 text-red-500" /> {deleting ? 'Menghapus…' : 'Hapus gambar'}
						</Button>
					</form>
				</div>
			{:else}
				<p class="mt-4 rounded-md bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
					Belum ada gambar QRIS. Unggah di bawah ini.
				</p>
			{/if}

			<form
				method="POST"
				action="?/uploadQris"
				enctype="multipart/form-data"
				use:enhance={hasil('upload')}
				class="mt-4 space-y-3 border-t border-slate-100 pt-4"
			>
				<div>
					<Label for="qris">File gambar QRIS</Label>
					<input
						id="qris"
						name="qris"
						type="file"
						accept="image/png,image/jpeg"
						required
						class="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 shadow-xs outline-none transition-colors file:mr-3 file:h-full file:cursor-pointer file:border-0 file:bg-slate-100 file:px-2.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
					/>
				</div>
				<Button type="submit" disabled={uploading} size="sm">
					<Upload class="h-3.5 w-3.5" /> {uploading ? 'Mengunggah…' : 'Unggah QRIS'}
				</Button>
			</form>
		</section>
		{/if}

		{#if tabAktif === 'semua' || tabAktif === 'wa'}
		<!-- WhatsApp Gateway & CS Bot Dipi -->
		<section class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
			<div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
				<div>
					<h2 class="flex items-center gap-2 text-sm font-bold text-slate-900">
						<MessageCircle class="h-4 w-4 text-green-600" /> WhatsApp Gateway & CS Bot Dipi
					</h2>
					<p class="mt-0.5 text-xs text-slate-500">
						Otomasi layanan pelanggan WhatsApp resmi toko dengan AI Maskot Dipi & RAG multi-turn cerdas.
					</p>
				</div>
				<div class="flex items-center gap-2">
					{#if waLiveStatus.connected}
						<span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
							<span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
							Terhubung {waLiveStatus.botNumber ? `(+${waLiveStatus.botNumber})` : ''}
						</span>
					{:else}
						<span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
							<span class="h-2 w-2 rounded-full bg-slate-400"></span>
							Offline / Belum Terhubung
						</span>
					{/if}
				</div>
			</div>

			<!-- Pilihan Mode Provider & Kontrol Koneksi -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
				<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
					<div>
						<p class="text-xs font-bold text-slate-800">Status Gateway: {waLiveStatus.detail || 'Memeriksa status…'}</p>
						<p class="text-[11px] text-slate-500 mt-0.5">
							Sistem menggunakan 1 nomor resmi toko untuk keandalan anti-ban dan branding seragam.
						</p>
					</div>

					<div class="flex items-center gap-2">
						{#if !waLiveStatus.connected}
							<form method="POST" action="?/waStartConnection" use:enhance={hasilWaConnect()}>
								<Button type="submit" size="sm" disabled={waConnecting} class="bg-green-600 hover:bg-green-700 text-white text-xs">
									<RefreshCw class="h-3.5 w-3.5 mr-1.5 {waConnecting ? 'animate-spin' : ''}" />
									{waConnecting ? 'Memulai…' : 'Hubungkan WhatsApp'}
								</Button>
							</form>
						{:else}
							<form method="POST" action="?/waDisconnect" use:enhance={hasilWaDisconnect()}>
								<Button type="submit" variant="destructive" size="sm" disabled={waDisconnecting} class="text-xs">
									{waDisconnecting ? 'Memutus…' : 'Putuskan Koneksi'}
								</Button>
							</form>
						{/if}
					</div>
				</div>

				<!-- TAMPILAN LIVE QR CODE & PAIRING CODE (JIKA BELUM TERHUBUNG) -->
				{#if !waLiveStatus.connected}
					<div class="mt-4 border-t border-slate-200/80 pt-4 space-y-4">
						{#if waLiveStatus.qrDataUrl}
							<div class="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-center space-y-3">
								<p class="text-xs font-semibold text-slate-800">
									📷 Scan QR Code berikut dengan WhatsApp di HP Toko:
								</p>
								<div class="p-2 bg-white rounded-lg border-2 border-slate-800 shadow-sm inline-block">
									<img
										src={waLiveStatus.qrDataUrl}
										alt="WhatsApp QR Code"
										class="w-56 h-56 object-contain"
									/>
								</div>
								<div class="text-[11px] text-slate-500 max-w-sm space-y-1">
									<p>1. Buka <b>WhatsApp</b> di ponsel Anda</p>
									<p>2. Ketuk <b>Menu (titik tiga)</b> atau <b>Pengaturan</b> &gt; <b>Perangkat Tertaut</b></p>
									<p>3. Ketuk <b>Tautkan Perangkat</b> lalu arahkan kamera ke layar ini</p>
									<p class="text-emerald-600 font-medium pt-1">🔄 QR akan auto-refresh otomatis setiap 30 detik</p>
								</div>
							</div>
						{/if}

						<!-- Atau Alternatif Pairing Code 8-Digit -->
						<div class="p-3.5 bg-white rounded-xl border border-slate-200 space-y-3">
							<div>
								<h4 class="text-xs font-bold text-slate-800">Opsi Alternatif: Pairing Code (Tanpa Kamera)</h4>
								<p class="text-[11px] text-slate-500 mt-0.5">
									Masukkan nomor WhatsApp toko untuk mendapatkan kode 8 digit yang bisa diketik langsung di aplikasi WA.
								</p>
							</div>

							<form method="POST" action="?/waRequestPairingCode" use:enhance={hasilPairingCode()} class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
								<input
									type="tel"
									name="phone"
									bind:value={pairingPhone}
									placeholder="Contoh: 081234567890 atau 628123456789"
									required
									class="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-green-600"
								/>
								<Button type="submit" size="sm" variant="outline" disabled={requestingPairing} class="text-xs">
									{requestingPairing ? 'Memproses…' : 'Minta Kode Pairing'}
								</Button>
							</form>

							{#if pairingCodeResult}
								<div class="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-center">
									<p class="text-[11px] font-medium text-amber-800">Kode Pairing Aktif (Ketikkan di HP Anda):</p>
									<p class="mt-1 font-mono text-2xl font-black tracking-widest text-amber-950">{pairingCodeResult}</p>
									<p class="mt-1 text-[10px] text-amber-700">Buka WA &gt; Perangkat Tertaut &gt; Tautkan dengan nomor telepon saja</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<!-- Form Konfigurasi AI Gateway Nine-Router (MJ9) -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
				<div class="border-b border-slate-200 pb-2">
					<h3 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
						<Bot class="h-3.5 w-3.5 text-blue-600" /> Otak AI Gateway Nine-Router (CS Maskot Dipi)
					</h3>
					<p class="text-[11px] text-slate-500 mt-0.5">
						Menggunakan Nine-Router Gateway (OpenAI Compatible) untuk RAG tanya jawab cetak, produk, dan estimasi harga.
					</p>
				</div>

				<form method="POST" action="?/simpanAiGateway" use:enhance={hasilAiGateway()} class="space-y-3">
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<Label for="ai_gateway_url" class="text-xs">Base URL Nine-Router</Label>
							<input
								id="ai_gateway_url"
								name="ai_gateway_url"
								type="url"
								defaultValue={(data as any).aiGateway?.url || 'https://mj9.sir-l.web.id/v1'}
								placeholder="https://mj9.sir-l.web.id/v1"
								required
								class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
							/>
						</div>
						<div>
							<Label for="ai_gateway_key" class="text-xs">Nine-Router API Key</Label>
							<input
								id="ai_gateway_key"
								name="ai_gateway_key"
								type="password"
								defaultValue={(data as any).aiGateway?.key || ''}
								placeholder="nr-xxxxxxxxxxxxxxxxxxxxxxxx"
								class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<Label for="ai_text_model" class="text-xs">Text Chat Model</Label>
							<input
								id="ai_text_model"
								name="ai_text_model"
								type="text"
								defaultValue={(data as any).aiGateway?.textModel || 'openai/gpt-4o-mini'}
								placeholder="openai/gpt-4o-mini"
								required
								class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
							/>
							<p class="mt-0.5 text-[10px] text-slate-400">Contoh: openai/gpt-4o-mini, anthropic/claude-3-5-haiku</p>
						</div>
						<div>
							<Label for="ai_vision_model" class="text-xs">Vision / Image Model (OCR Cetak)</Label>
							<input
								id="ai_vision_model"
								name="ai_vision_model"
								type="text"
								defaultValue={(data as any).aiGateway?.visionModel || 'openai/gpt-4o-mini'}
								placeholder="openai/gpt-4o-mini"
								required
								class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
							/>
						</div>
					</div>

					<div class="pt-1">
						<Button type="submit" size="sm" disabled={savingAi} class="text-xs bg-slate-900 hover:bg-slate-800 text-white">
							{savingAi ? 'Menyimpan…' : 'Simpan Konfigurasi AI Gateway'}
						</Button>
					</div>
				</form>
			</div>

			<!-- Statistik Antrian & Anti-Ban Risk Guard -->
			<div class="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
				<h4 class="text-xs font-bold text-slate-900 flex items-center justify-between">
					<span>Metrik Pengiriman & Proteksi Anti-Ban Meta</span>
					<span class="text-[11px] font-normal text-slate-500">Risk Score: <b>{data.waRisk} / 100</b></span>
				</h4>

				<div class="grid grid-cols-3 gap-2 text-center">
					<div class="rounded-lg bg-slate-50 border border-slate-100 px-2 py-2">
						<p class="text-base font-bold text-slate-900">{data.waQueue.queued}</p>
						<p class="text-[10px] text-slate-500">Antrian</p>
					</div>
					<div class="rounded-lg bg-emerald-50/60 border border-emerald-100 px-2 py-2">
						<p class="text-base font-bold text-emerald-700">{data.waQueue.sent}</p>
						<p class="text-[10px] text-emerald-600">Terkirim</p>
					</div>
					<div class="rounded-lg bg-rose-50/60 border border-rose-100 px-2 py-2">
						<p class="text-base font-bold text-rose-600">{data.waQueue.failed}</p>
						<p class="text-[10px] text-rose-500">Gagal</p>
					</div>
				</div>

				<div class="flex items-center justify-between border-t border-slate-100 pt-2.5">
					<form method="POST" action="?/waResetRisk" use:enhance>
						<Button type="submit" variant="outline" size="sm" class="text-xs">
							Reset Risk Score
						</Button>
					</form>

					<form method="POST" action="?/waKillSwitch" use:enhance>
						<input type="hidden" name="aktif" value={data.waKillSwitch ? '0' : '1'} />
						<Button type="submit" variant={data.waKillSwitch ? 'default' : 'destructive'} size="sm" class="text-xs">
							{data.waKillSwitch ? 'Nyalakan Kembali' : 'Kill Switch Darurat'}
						</Button>
					</form>
				</div>
			</div>
		</section>
		{/if}

		{#if tabAktif === 'semua' || tabAktif === 'devops'}
		<!-- DevOps: Offsite Backup, Staging & Heartbeat Monitoring -->
		<section class="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
			<div>
				<h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900">
					<HardDrive class="h-4 w-4 text-brand-700" /> DevOps, Backup & Uptime Monitoring
				</h2>
				<p class="mt-1 text-xs text-slate-500">
					Keandalan sistem: Offsite daily backup SQLite, Staging isolation, dan integrasi heartbeat monitoring.
				</p>
			</div>

			<!-- 1. Offsite Snapshot Database -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
				<div class="flex items-start justify-between gap-2">
					<div>
						<h3 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
							<Database class="h-3.5 w-3.5 text-brand-600" />
							Offsite SQLite Backup ke Telegram Owner
						</h3>
						<p class="text-[11px] text-slate-500 mt-0.5">
							Snapshot konsisten atomic via SQLite <code>VACUUM INTO</code>. Dikirim langsung sebagai dokumen ke chat pribadi Telegram Owner.
						</p>
					</div>
					<Badge variant="success" class="text-[10px] py-0 px-1.5 whitespace-nowrap">Auto 02:00 WIB</Badge>
				</div>

				<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
					<form method="POST" action="?/backupDatabase" use:enhance={hasilBackup()} class="w-full sm:w-auto">
						<Button type="submit" size="sm" disabled={backingUpDb} class="w-full sm:w-auto text-xs font-semibold">
							<Database class="h-3.5 w-3.5 mr-1.5 {backingUpDb ? 'animate-spin' : ''}" />
							{backingUpDb ? 'Memproses Snapshot…' : '📦 Snapshot & Kirim ke Telegram Sekarang'}
						</Button>
					</form>
					<span class="text-[10px] text-slate-400">Atau ketik <code>/backup_db</code> di Telegram</span>
				</div>
			</div>

			<!-- 2. External Heartbeat Monitoring (Healthchecks.io / BetterStack) -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
				<div>
					<h3 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
						<Activity class="h-3.5 w-3.5 text-emerald-600" />
						External Uptime & Heartbeat Monitoring
					</h3>
					<p class="text-[11px] text-slate-500 mt-0.5">
						Dipanggil setiap kali cron job malam & reminder berjalan. Jika server toko mati / VPS crash, BetterStack atau Healthchecks.io akan langsung membunyikan alarm darurat.
					</p>
				</div>

				<form method="POST" action="?/simpanHeartbeat" use:enhance={hasilSimpanHeartbeat()} class="space-y-2">
					<div>
						<Label for="heartbeat_url" class="text-xs">Heartbeat Ping URL (Outbound)</Label>
						<input
							id="heartbeat_url"
							name="heartbeat_url"
							type="url"
							defaultValue={data.heartbeatUrl}
							placeholder="https://hc-ping.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
							class="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-xs text-slate-900 outline-none focus:border-brand-600"
						/>
						<p class="mt-1 text-[10px] text-slate-400">Dapatkan ping URL gratis dari Healthchecks.io atau BetterStack Heartbeats.</p>
					</div>

					<div class="flex items-center gap-2 pt-1">
						<Button type="submit" size="sm" disabled={savingHeartbeat} class="text-xs">
							{savingHeartbeat ? 'Menyimpan…' : 'Simpan URL'}
						</Button>
					</div>
				</form>

				<div class="flex items-center justify-between border-t border-slate-200/80 pt-2.5">
					<form method="POST" action="?/ujiPingHeartbeat" use:enhance={hasilUjiHeartbeat()}>
						<Button type="submit" variant="outline" size="sm" disabled={pingingHeartbeat || !data.heartbeatUrl} class="text-xs">
							<Activity class="h-3 w-3 mr-1 text-emerald-600 {pingingHeartbeat ? 'animate-pulse' : ''}" />
							{pingingHeartbeat ? 'Mengirim Ping…' : '⚡ Uji Ping Heartbeat'}
						</Button>
					</form>

					<a
						href="/api/health"
						target="_blank"
						class="text-[11px] text-brand-600 hover:underline flex items-center gap-1 font-medium"
					>
						<ShieldCheck class="h-3.5 w-3.5" /> Lihat Endpoint /api/health
					</a>
				</div>
			</div>

			<!-- 3. Staging Pipeline Info -->
			<div class="rounded-xl border border-dashed border-slate-300 bg-white p-3 space-y-1">
				<p class="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
					<GitMerge class="h-3 w-3 text-brand-600" /> Staging Pipeline Terisolasi (Branch <code>dev</code>)
				</p>
				<p class="text-[10px] text-slate-500 leading-relaxed">
					Push ke branch <code>dev</code> akan di-deploy ke server staging (port <code>3005</code> & <code>staging.db</code>).
					Notifikasi deploy Telegram otomatis menyediakan tombol <b>[ 🚀 Rilis ke Production ]</b> untuk merge cepat ke <code>main</code> tanpa perlu membuka GitHub.
				</p>
			</div>
		</section>
		{/if}
	</div>
	{/if}
</div>
