import path from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Escape tag HTML agar aman dikirim ke Telegram API (parse_mode: HTML)
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Render visual progress loading bar:
 * Contoh: [████████░░░░░░░░] 50% (21/42)
 */
function renderProgressBar(current: number, total: number, barLength = 16): string {
	const ratio = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
	const filled = Math.round(ratio * barLength);
	const empty = Math.max(0, barLength - filled);
	const percent = Math.round(ratio * 100);
	return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percent}% (${current}/${total})`;
}

class TelegramRealtimeReporter implements Reporter {
	private token: string | undefined;
	private chatId: string;
	private topicId: string | undefined;
	private branch: string;
	private commit: string;

	private totalTests = 0;
	private completedTests = 0;
	private passedTests = 0;
	private failedTests = 0;
	private skippedTests = 0;

	// Info fitur yang SEDANG diuji saat ini secara realtime
	private currentFeatureTitle = '';
	private currentFeatureFile = '';

	private messageIds: { chatId: string; messageId: number }[] = [];
	private lastUpdateMs = 0;
	private updateThrottleMs = 1200; // Batasi edit maksimal 1x per 1.2 detik agar tidak terkena limit Telegram
	private pendingTimer: NodeJS.Timeout | null = null;
	private startTime = 0;
	private recentActivities: string[] = [];

	constructor() {
		this.token = process.env.TELEGRAM_BOT_TOKEN;
		this.chatId = process.env.TELEGRAM_DEV_CHAT_ID || '-1003915875597';
		this.topicId = process.env.TELEGRAM_DEV_TOPIC_ID || '6';
		this.branch = process.env.GITHUB_REF_NAME || process.env.BRANCH || 'luthfi_dev';
		this.commit = (process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'local').slice(0, 7);
	}

	async onBegin(config: FullConfig, suite: Suite) {
		this.startTime = Date.now();
		this.totalTests = suite.allTests().length;
		this.currentFeatureTitle = 'Inisialisasi lingkungan pengujian Playwright...';
		console.log(`[telegram-reporter] 🚀 Memulai pengujian Playwright (${this.totalTests} tests terdeteksi)...`);

		if (!this.token || !this.chatId || this.totalTests === 0) {
			return;
		}

		const text = this.buildMessageText('running');
		await this.sendInitialMessage(text);
	}

	onTestBegin(test: TestCase, result: TestResult) {
		const cleanTitle = test.title.replace(/<[^>]*>?/gm, '');
		const suiteName = test.parent?.title ? test.parent.title.replace(/<[^>]*>?/gm, '') : '';
		
		// Format nama fitur: jika ada nama suite, gabungkan (misal: "Katalog Produk & Estimasi Harga Cetak")
		this.currentFeatureTitle = suiteName && !cleanTitle.startsWith(suiteName) 
			? `${suiteName} › ${cleanTitle}` 
			: cleanTitle;
		this.currentFeatureFile = path.basename(test.location.file || '');

		// Trigger update agar status fitur yang sedang diuji langsung ter-update di Telegram
		this.scheduleUpdate('running');
	}

	async onTestEnd(test: TestCase, result: TestResult) {
		this.completedTests++;
		const icon = result.status === 'passed' ? '✅' : result.status === 'skipped' ? '⚠️' : '❌';
		if (result.status === 'passed') this.passedTests++;
		else if (result.status === 'skipped') this.skippedTests++;
		else this.failedTests++;

		const cleanTitle = test.title.replace(/<[^>]*>?/gm, '');
		const shortTitle = cleanTitle.length > 38 ? cleanTitle.slice(0, 35) + '...' : cleanTitle;
		this.recentActivities.push(`${icon} ${shortTitle} (${result.duration}ms)`);
		if (this.recentActivities.length > 4) {
			this.recentActivities.shift();
		}

		this.scheduleUpdate('running');
	}

	async onEnd(result: FullResult) {
		if (this.pendingTimer) {
			clearTimeout(this.pendingTimer);
			this.pendingTimer = null;
		}
		this.currentFeatureTitle = '';
		const finalStatus = result.status === 'passed' ? 'completed' : 'failed';
		const text = this.buildMessageText(finalStatus);
		await this.editAllMessages(text);
		console.log(`[telegram-reporter] 🏁 Progress bar pengujian Telegram selesai: ${this.completedTests}/${this.totalTests} tests.`);
	}

	private buildMessageText(state: 'running' | 'completed' | 'failed'): string {
		const bar = renderProgressBar(this.completedTests, this.totalTests, 16);
		const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);

		const header =
			state === 'running'
				? `🚀 <b>PLAYWRIGHT E2E TESTING (IN PROGRESS)</b>`
				: state === 'completed'
				? `🎉 <b>PLAYWRIGHT E2E TESTING SELESAI (SUKSES)</b>`
				: `⚠️ <b>PLAYWRIGHT E2E TESTING SELESAI (ADA GAGAL)</b>`;

		const statusLine = `✅ ${this.passedTests} Passed  |  ❌ ${this.failedTests} Failed  |  ⏳ ${this.totalTests - this.completedTests} Pending`;

		// Blok informasi fitur yang sedang diuji
		let currentStepBlock = '';
		if (state === 'running' && this.currentFeatureTitle) {
			const safeTitle = escapeHtml(this.currentFeatureTitle);
			const safeFile = escapeHtml(this.currentFeatureFile);
			currentStepBlock = `\n🔄 <b>Sedang Menguji Fitur:</b>\n👉 <code>${safeTitle}</code> ${safeFile ? `<i>(${safeFile})</i>` : ''}\n`;
		} else if (state === 'completed') {
			currentStepBlock = `\n✨ <b>Hasil Akhir:</b> Seluruh <b>${this.totalTests}</b> skenario fitur terverifikasi 100% lolos.\n`;
		} else if (state === 'failed') {
			currentStepBlock = `\n⚠️ <b>Perhatian:</b> Terdapat <b>${this.failedTests}</b> skenario pengujian yang gagal/timeout.\n`;
		}

		const recentBlock =
			this.recentActivities.length > 0
				? `\n<b>Riwayat Pengujian Terakhir:</b>\n` + this.recentActivities.map((a) => `<code>${escapeHtml(a)}</code>`).join('\n')
				: '';

		return [
			header,
			`━━━━━━━━━━━━━━━━━━━━━━━━━`,
			`🌿 <b>Branch:</b> <code>${this.branch}</code>  |  🏷️ <code>${this.commit}</code>`,
			`📊 <b>Progress:</b> <code>${bar}</code>`,
			`⏱️ <b>Status:</b> ${statusLine}`,
			`⌛ <b>Durasi:</b> ${duration}s`,
			currentStepBlock + recentBlock
		].join('\n');
	}

	private async sendInitialMessage(text: string) {
		try {
			const body: Record<string, any> = {
				chat_id: this.chatId,
				text,
				parse_mode: 'HTML',
				disable_web_page_preview: true
			};
			if (this.topicId) {
				body.message_thread_id = Number(this.topicId);
			}

			const res = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const data = (await res.json()) as any;
			if (data.ok && data.result?.message_id) {
				this.messageIds.push({ chatId: this.chatId, messageId: data.result.message_id });
			}
		} catch (e) {
			console.warn('[telegram-reporter] Gagal mengirim pesan progress awal:', e);
		}
	}

	private scheduleUpdate(state: 'running' | 'completed' | 'failed') {
		const now = Date.now();
		const elapsed = now - this.lastUpdateMs;

		if (elapsed >= this.updateThrottleMs) {
			this.lastUpdateMs = now;
			this.editAllMessages(this.buildMessageText(state)).catch(() => {});
		} else {
			if (!this.pendingTimer) {
				this.pendingTimer = setTimeout(() => {
					this.pendingTimer = null;
					this.lastUpdateMs = Date.now();
					this.editAllMessages(this.buildMessageText(state)).catch(() => {});
				}, this.updateThrottleMs - elapsed);
			}
		}
	}

	private async editAllMessages(text: string) {
		if (!this.token || this.messageIds.length === 0) return;

		for (const item of this.messageIds) {
			try {
				await fetch(`https://api.telegram.org/bot${this.token}/editMessageText`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						chat_id: item.chatId,
						message_id: item.messageId,
						text,
						parse_mode: 'HTML',
						disable_web_page_preview: true
					})
				});
			} catch {
				// Abaikan jika rate-limit sementara atau tidak ada perubahan
			}
		}
	}
}

export default TelegramRealtimeReporter;
