import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const RESULTS_DIR = path.resolve('test-results');
export const SCREENSHOT_DIR = path.resolve(RESULTS_DIR, 'screenshots');
export const METADATA_FILE = path.resolve(RESULTS_DIR, 'e2e-summary.json');

export const AUTH_FILES = {
	owner: path.resolve(RESULTS_DIR, 'auth-owner.json'),
	admin: path.resolve(RESULTS_DIR, 'auth-admin.json'),
	operator: path.resolve(RESULTS_DIR, 'auth-operator.json')
} as const;

export type AuthRole = keyof typeof AUTH_FILES;

export interface E2ERecordItem {
	id: string;
	title: string;
	category: string;
	route: string;
	status: 'passed' | 'failed';
	screenshot: string;
	notes: string;
	durationMs?: number;
}

export function ensureResultsDirs(): void {
	if (!fs.existsSync(SCREENSHOT_DIR)) {
		fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
	}
}

export function resetSummary(): void {
	ensureResultsDirs();
	fs.writeFileSync(METADATA_FILE, '[]', 'utf-8');
}

export function recordResult(item: E2ERecordItem): void {
	ensureResultsDirs();
	let current: E2ERecordItem[] = [];
	if (fs.existsSync(METADATA_FILE)) {
		try {
			current = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
		} catch {
			current = [];
		}
	}
	const existingIdx = current.findIndex((c) => c.id === item.id);
	if (existingIdx >= 0) {
		current[existingIdx] = item;
	} else {
		current.push(item);
	}
	fs.writeFileSync(METADATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
}

/**
 * Pasang guard untuk menangkap uncaught JS exception (`pageerror`)
 * dan HTTP server error (`>= 500`) selama eksekusi test.
 */
export function attachErrorGuards(page: Page) {
	const pageErrors: string[] = [];
	const serverErrors: string[] = [];

	page.on('pageerror', (err) => {
		pageErrors.push(err.message || String(err));
	});

	page.on('response', (res) => {
		const status = res.status();
		if (status >= 500) {
			serverErrors.push(`${status} ${res.request().method()} ${res.url()}`);
		}
	});

	return {
		pageErrors,
		serverErrors,
		assertNoErrors() {
			expect(pageErrors, `Uncaught page errors detected:\n${pageErrors.join('\n')}`).toEqual([]);
			expect(serverErrors, `HTTP 5xx responses detected:\n${serverErrors.join('\n')}`).toEqual([]);
		}
	};
}
