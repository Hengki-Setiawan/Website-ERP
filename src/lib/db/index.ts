// Database Client - Supports both Turso (Cloud) and sql.js (Local)
import { createClient, Client, InValue } from '@libsql/client';
import { DATABASE_SCHEMA, DEFAULT_SETTINGS, DEFAULT_MODULES, generateId } from './schema';

// Database client singleton
let dbClient: Client | null = null;

// Initialize Turso (Cloud) database
export async function initTursoDb(url: string, authToken: string): Promise<Client> {
    try {
        const client = createClient({
            url,
            authToken,
        });

        // Test connection
        await client.execute('SELECT 1');

        dbClient = client;
        return client;
    } catch (error) {
        console.error('Failed to connect to Turso:', error);
        throw error;
    }
}

// Get current database client
export function getDbClient(): Client | null {
    return dbClient;
}

// Initialize database schema
export async function initializeDatabase(client: Client): Promise<void> {
    try {
        // Execute schema
        const statements = DATABASE_SCHEMA.split(';').filter(s => s.trim().length > 0);

        for (const statement of statements) {
            await client.execute(statement);
        }

        // Insert default settings if not exists
        for (const setting of DEFAULT_SETTINGS) {
            await client.execute({
                sql: `INSERT OR IGNORE INTO settings (key, value, category) VALUES (?, ?, ?)`,
                args: [setting.key, setting.value, setting.category],
            });
        }

        // Insert default modules if not exists
        for (const module of DEFAULT_MODULES) {
            await client.execute({
                sql: `INSERT OR IGNORE INTO modules (id, name, slug, icon, description, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [module.id, module.name, module.slug, module.icon, module.description || null, module.enabled, module.sort_order],
            });
        }

        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

// Test database connection
export async function testConnection(url: string, authToken: string): Promise<{ success: boolean; message: string; tables?: number }> {
    try {
        const client = createClient({ url, authToken });
        await client.execute('SELECT 1');

        // Count tables
        const result = await client.execute("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
        const tableCount = Number(result.rows[0]?.count) || 0;

        return {
            success: true,
            message: 'Koneksi berhasil!',
            tables: tableCount,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Gagal terhubung ke database',
        };
    }
}

// Generic CRUD operations
export async function query<T>(sql: string, args: InValue[] = []): Promise<T[]> {
    if (!dbClient) throw new Error('Database not initialized');

    const result = await dbClient.execute({ sql, args });
    return result.rows as T[];
}

export async function queryOne<T>(sql: string, args: InValue[] = []): Promise<T | null> {
    const results = await query<T>(sql, args);
    return results[0] || null;
}

export async function execute(sql: string, args: InValue[] = []): Promise<number> {
    if (!dbClient) throw new Error('Database not initialized');

    const result = await dbClient.execute({ sql, args });
    return result.rowsAffected;
}

// Re-export
export { generateId };
