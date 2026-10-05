import adapter from '@sveltejs/adapter-auto';
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

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
