/**
 * Email transaksional FD Digital Printing via Resend.
 *
 * Tanpa RESEND_API_KEY (dev): email DICETAK ke terminal, bukan dikirim.
 * Jadi sign-up / reset password lokal tetap bisa dites.
 */
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? 'FD Digital Printing <noreply@fdprinting.local>';

export type EmailOpts = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

/** Cek apakah pengiriman email real sudah bisa dipakai (API key tersedia). */
export function emailConfigured(): boolean {
	return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: EmailOpts) {
	if (!resend) {
		console.log(
			`\n[email:dev] ─────────────────────────\n` +
				`Ke: ${opts.to}\nSubjek: ${opts.subject}\n\n` +
				`${opts.text ?? opts.html}\n` +
				`───────────────────────────────\n`
		);
		return { id: 'dev', dev: true as const };
	}
	return await resend.emails.send({ from: FROM, ...opts });
}

/** Email dalam Bahasa Indonesia, satu bentuk konsisten. */
export function emailLayout(judul: string, isiHtml: string): string {
	return `<!doctype html><html lang="id"><body style="font-family:sans-serif;max-width:560px;margin:auto;color:#1e293b">
<h2 style="color:#002b57">${judul}</h2>
${isiHtml}
<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
<p style="font-size:12px;color:#64748b">FD Digital Printing — email otomatis, jangan dibalas.</p>
</body></html>`;
}
