/**
 * Integrasi GitHub REST API untuk ChatOps FD Digital Printing
 *
 * Memungkinkan Owner merilis fitur dari branch 'dev' (staging) ke 'main' (production)
 * langsung lewat chat / tombol bot Telegram tanpa harus membuka browser GitHub.
 */
import { getSetting } from './settings';

const DEFAULT_REPO = 'itzluthfi/fd-digital-printing';

export async function getGitHubConfig(): Promise<{ token: string; repo: string }> {
	const dbToken = await getSetting('github_token');
	const token = (dbToken || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();

	const dbRepo = await getSetting('github_repo');
	const repo = (dbRepo || process.env.GITHUB_REPO || DEFAULT_REPO).trim();

	return { token, repo };
}

export type BranchComparison = {
	ok: boolean;
	aheadBy: number;
	behindBy: number;
	commits: Array<{ sha: string; message: string; author: string }>;
	message?: string;
};

/**
 * Membandingkan commit antara branch dev (head) dan main (base).
 */
export async function compareDevWithMain(): Promise<BranchComparison> {
	const { token, repo } = await getGitHubConfig();
	if (!token) {
		return { ok: false, aheadBy: 0, behindBy: 0, commits: [], message: 'GITHUB_TOKEN belum diset di pengaturan.' };
	}

	try {
		const res = await fetch(`https://api.github.com/repos/${repo}/compare/main...dev`, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'FD-Digital-Printing-Bot'
			}
		});

		if (res.status === 404) {
			return { ok: false, aheadBy: 0, behindBy: 0, commits: [], message: 'Branch "dev" belum dibuat di GitHub.' };
		}
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return { ok: false, aheadBy: 0, behindBy: 0, commits: [], message: err.message || `HTTP ${res.status}` };
		}

		const data = await res.json();
		const commits = (data.commits || []).map((c: any) => ({
			sha: c.sha ? c.sha.slice(0, 7) : '',
			message: c.commit?.message?.split('\n')[0] || '',
			author: c.commit?.author?.name || c.author?.login || 'Developer'
		}));

		return {
			ok: true,
			aheadBy: data.ahead_by ?? 0,
			behindBy: data.behind_by ?? 0,
			commits
		};
	} catch (err) {
		return { ok: false, aheadBy: 0, behindBy: 0, commits: [], message: String(err) };
	}
}

export type MergeResult = {
	ok: boolean;
	status: 'created' | 'already_merged' | 'conflict' | 'error';
	sha?: string;
	message: string;
};

/**
 * Melakukan merge dari branch 'dev' ke 'main' via GitHub API.
 * Memicu CD workflow GitHub Actions secara otomatis.
 */
export async function mergeDevToMain(authorName: string): Promise<MergeResult> {
	const { token, repo } = await getGitHubConfig();
	if (!token) {
		return {
			ok: false,
			status: 'error',
			message: 'GITHUB_TOKEN belum dikonfigurasi. Masukkan token di menu Pengaturan Web.'
		};
	}

	try {
		const commitMessage = `Merge branch 'dev' into main via Telegram ChatOps by ${authorName}`;
		const res = await fetch(`https://api.github.com/repos/${repo}/merges`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github.v3+json',
				'Content-Type': 'application/json',
				'User-Agent': 'FD-Digital-Printing-Bot'
			},
			body: JSON.stringify({
				base: 'main',
				head: 'dev',
				commit_message: commitMessage
			})
		});

		if (res.status === 201) {
			const data = await res.json();
			const sha = data.sha ? data.sha.slice(0, 7) : '';
			return {
				ok: true,
				status: 'created',
				sha,
				message: `Merge dev ➔ main berhasil (Commit ${sha}). Workflow CD Production otomatis berjalan.`
			};
		}

		if (res.status === 204) {
			return {
				ok: true,
				status: 'already_merged',
				message: 'Branch main sudah up to date dengan dev. Tidak ada perubahan baru untuk dimerge.'
			};
		}

		if (res.status === 409) {
			return {
				ok: false,
				status: 'conflict',
				message: '⚠️ Gagal Merge: Terjadi Merge Conflict antara dev dan main. Developer harus menyelesaikannya secara manual di git local.'
			};
		}

		if (res.status === 404) {
			return {
				ok: false,
				status: 'error',
				message: '⚠️ Branch "dev" atau repository tidak ditemukan. Pastikan branch dev sudah di-push ke GitHub.'
			};
		}

		const errData = await res.json().catch(() => ({}));
		return {
			ok: false,
			status: 'error',
			message: errData.message || `Gagal melakukan merge (HTTP ${res.status}).`
		};
	} catch (err) {
		return {
			ok: false,
			status: 'error',
			message: `Gagal menghubungi GitHub API: ${String(err)}`
		};
	}
}
