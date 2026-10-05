import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	preview: {
		allowedHosts: ['fd-printing.sir-l.web.id']
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			// CSRF: di belakang Cloudflare Tunnel, server hanya melihat HTTP biasa
			// sehingga origin https://... tidak cocok otomatis — daftarkan publik
			// origin lewat env TRUSTED_ORIGINS (koma-dipisah bila >1).
			csrf: {
				trustedOrigins: (process.env.TRUSTED_ORIGINS ?? '')
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			},
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Production di VPS: adapter-node → output build/index.js
			// dijalankan dengan `bun ./build/index.js` (atau node).
			adapter: adapter()
		})
	]
});
