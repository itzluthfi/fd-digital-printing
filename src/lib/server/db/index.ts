import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import * as schema from './schema';

const sqlite = new Database(process.env.DB_PATH ?? './data/app.db');
export const db = drizzle(sqlite, { schema });
