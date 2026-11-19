import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * Render visual progress loading bar:
 * Contoh: [████████░░░░░░░░] 50% (5/10)
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
		console.log(`[telegram-reporter] 🚀 Memulai pengujian Playwright (${this.totalTests} tests terdeteksi)...`);

		if (!this.token || !this.chatId || this.totalTests === 0) {
			return;
		}

		const text = this.buildMessageText('running');
		await this.sendInitialMessage(text);
	}

	async onTestEnd(test: TestCase, result: TestResult) {
		this.completedTests++;
		const icon = result.status === 'passed' ? '✅' : result.status === 'skipped' ? '⚠️' : '❌';
		if (result.status === 'passed') this.passedTests++;
		else if (result.status === 'skipped') this.skippedTests++;
		else this.failedTests++;

		const cleanTitle = test.title.replace(/<[^>]*>?/gm, '');
		const shortTitle = cleanTitle.length > 40 ? cleanTitle.slice(0, 37) + '...' : cleanTitle;
		this.recentActivities.push(`${icon} ${shortTitle} (${result.duration}ms)`);
		if (this.recentActivities.length > 5) {
			this.recentActivities.shift();
		}

		this.scheduleUpdate('running');
	}

	async onEnd(result: FullResult) {
		if (this.pendingTimer) {
			clearTimeout(this.pendingTimer);
			this.pendingTimer = null;
		}
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

		const recentBlock =
			this.recentActivities.length > 0
				? `\n\n<b>Aktivitas Pengujian Terbaru:</b>\n` + this.recentActivities.map((a) => `<code>${a}</code>`).join('\n')
				: '';

		return [
			header,
			`━━━━━━━━━━━━━━━━━━━━━━━━━`,
			`🌿 <b>Branch:</b> <code>${this.branch}</code>  |  🏷️ <code>${this.commit}</code>`,
			`📊 <b>Progress:</b> <code>${bar}</code>`,
			`⏱️ <b>Status:</b> ${statusLine}`,
			`⌛ <b>Durasi:</b> ${duration}s`,
			recentBlock
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
