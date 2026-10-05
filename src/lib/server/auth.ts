/**
 * Better Auth — email + password, 5 role via kolom user.role.
 *
 * - Sesi 7 hari (cookie), rate limit 100/menit bawaan.
 * - Verifikasi email dikirim saat sign-up (wajib untuk Customer di Fase 4).
 * - Link reset password kedaluwarsa 1 jam (default Better Auth).
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from './db';
import { sendEmail, emailLayout } from './email';

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	trustedOrigins: [
		'http://localhost:5173',
		'http://127.0.0.1:5173',
		...(process.env.TRUSTED_ORIGINS ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	],
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID ?? '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
			enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
		}
	},
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: 'Reset password FD Digital Printing',
				html: emailLayout(
					'Reset password',
					`<p>Klik tautan berikut untuk membuat password baru. Tautan kedaluwarsa dalam 1 jam.</p>
					 <p><a href="${url}">Reset password saya</a></p>
					 <p>Jika Anda tidak meminta ini, abaikan email ini.</p>`
				),
				text: `Reset password: ${url} (kedaluwarsa 1 jam)`
			});
		}
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: 'Verifikasi email FD Digital Printing',
				html: emailLayout(
					'Verifikasi email',
					`<p>Klik tautan berikut untuk memverifikasi alamat email Anda.</p>
					 <p><a href="${url}">Verifikasi email saya</a></p>`
				),
				text: `Verifikasi email: ${url}`
			});
		}
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				required: false,
				defaultValue: 'customer',
				input: false
			}
		}
	}
});

export type Session = typeof auth.$Infer.Session;
