const isBrowser = typeof window !== 'undefined';

class ThemeStore {
	isDark = $state(false);

	constructor() {
		if (isBrowser) {
			const saved = localStorage.getItem('theme');
			// Default cerah (light) sesuai preferensi pengguna
			this.isDark = saved === 'dark';
			this.apply();
		}
	}

	toggle() {
		this.isDark = !this.isDark;
		if (isBrowser) {
			localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
			this.apply();
		}
	}

	apply() {
		if (isBrowser) {
			if (this.isDark) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}
}

export const theme = new ThemeStore();
