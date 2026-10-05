import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import * as schema from './schema';

const dbPath = process.env.DB_PATH ?? './data/app.db';
// bun:sqlite membuat file DB otomatis, tapi foldernya harus sudah ada.
// (Penting untuk fresh clone & CI: folder data/ masuk .gitignore.)
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
