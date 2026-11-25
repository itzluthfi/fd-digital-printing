/**
 * Runner & JSON Exporter untuk Unit & Integration Tests (Bun Test)
 * Mengekspor hasil pengujian ke test-results/unit-summary.json
 * untuk direkap ke dalam Laporan PDF Eksekutif.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export interface UnitTestItem {
	suite: string;
	title: string;
	type: 'Unit Test' | 'Integration Test';
	status: 'passed' | 'failed';
	durationMs: number;
	file: string;
}

export interface UnitSummaryReport {
	timestamp: string;
	total: number;
	passed: number;
	failed: number;
	unitCount: number;
	integrationCount: number;
	totalDurationMs: number;
	items: UnitTestItem[];
}

export function runAndExportUnitTests(): UnitSummaryReport {
	console.log('[test-exporter] 🧪 Menjalankan Unit & Integration Tests via bun test...');

	// Jalankan bun test tests/unit tests/integration
	const proc = spawnSync('bun', ['test', 'tests/unit', 'tests/integration'], {
		encoding: 'utf-8',
		env: { ...process.env, FORCE_COLOR: '0' }
	});

	const stdout = (proc.stdout || '') + '\n' + (proc.stderr || '');
	const lines = stdout.split(/\r?\n/);

	const items: UnitTestItem[] = [];
	let currentFile = '';

	for (const line of lines) {
		const trimmed = line.trim();

		// Deteksi header file uji (misal: tests/unit/format.test.ts: atau tests\unit\format.test.ts:)
		const fileMatch = trimmed.match(/^(tests[\\/](unit|integration)[\\/][a-zA-Z0-9_.-]+\.test\.ts):?$/i);
		if (fileMatch) {
			currentFile = fileMatch[1].replace(/\\/g, '/');
			continue;
		}

		// Deteksi baris hasil test (misal: (pass) Format Utility (Unit Test) > rupiah() > ... [3.06ms])
		const testMatch = trimmed.match(/^\((pass|fail)\)\s+(.+?)\s+\[([0-9.]+)ms\]$/);
		if (testMatch) {
			const status = testMatch[1] === 'pass' ? 'passed' : 'failed';
			const fullTitle = testMatch[2];
			const durationMs = parseFloat(testMatch[3]) || 0;

			// Pecah judul "Suite Name (Type) > test name"
			const parts = fullTitle.split('>').map((p) => p.trim());
			const suite = parts.length > 1 ? parts[0] : (currentFile ? path.basename(currentFile, '.test.ts') : 'General');
			const title = parts.length > 1 ? parts.slice(1).join(' > ') : fullTitle;
			const type: 'Unit Test' | 'Integration Test' = currentFile.includes('/integration/')
				? 'Integration Test'
				: 'Unit Test';

			items.push({
				suite,
				title,
				type,
				status,
				durationMs,
				file: currentFile
			});
		}
	}

	const passed = items.filter((i) => i.status === 'passed').length;
	const failed = items.filter((i) => i.status === 'failed').length;
	const unitCount = items.filter((i) => i.type === 'Unit Test').length;
	const integrationCount = items.filter((i) => i.type === 'Integration Test').length;
	const totalDurationMs = items.reduce((acc, curr) => acc + curr.durationMs, 0);

	const summary: UnitSummaryReport = {
		timestamp: new Date().toISOString(),
		total: items.length,
		passed,
		failed,
		unitCount,
		integrationCount,
		totalDurationMs: Math.round(totalDurationMs * 100) / 100,
		items
	};

	const outDir = path.resolve('test-results');
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}

	const outFile = path.join(outDir, 'unit-summary.json');
	fs.writeFileSync(outFile, JSON.stringify(summary, null, 2), 'utf-8');
	console.log(`[test-exporter] ✅ Berhasil mengekspor ${items.length} hasil uji (${unitCount} Unit, ${integrationCount} Integration) ke: ${outFile}`);

	return summary;
}

// Jika dieksekusi langsung
if (import.meta.main) {
	const summary = runAndExportUnitTests();
	if (summary.failed > 0) {
		process.exit(1);
	}
}
