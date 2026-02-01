// API Route: Initialize Database with Schema
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { cookies } from 'next/headers';
import { DATABASE_SCHEMA, DEFAULT_SETTINGS, DEFAULT_MODULES } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tursoUrl, tursoToken, saveCredentials } = body;

        if (!tursoUrl || !tursoToken) {
            return NextResponse.json({ success: false, message: 'URL dan Token diperlukan' }, { status: 400 });
        }

        const client = createClient({ url: tursoUrl, authToken: tursoToken });

        // Test connection first
        await client.execute('SELECT 1');

        // Execute schema
        const statements = DATABASE_SCHEMA.split(';').filter(s => s.trim().length > 0);
        let tablesCreated = 0;

        for (const statement of statements) {
            try {
                await client.execute(statement);
                if (statement.toLowerCase().includes('create table')) {
                    tablesCreated++;
                }
            } catch (e) {
                // Ignore errors for CREATE IF NOT EXISTS
                console.log('Statement skipped:', e);
            }
        }

        // Insert default settings
        for (const setting of DEFAULT_SETTINGS) {
            await client.execute({
                sql: `INSERT OR IGNORE INTO settings (key, value, category) VALUES (?, ?, ?)`,
                args: [setting.key, setting.value, setting.category],
            });
        }

        // Insert default modules
        for (const module of DEFAULT_MODULES) {
            await client.execute({
                sql: `INSERT OR IGNORE INTO modules (id, name, slug, icon, description, enabled, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [module.id, module.name, module.slug, module.icon, module.description || null, module.enabled, module.sort_order],
            });
        }

        // Save credentials to cookies if requested
        if (saveCredentials) {
            const cookieStore = await cookies();
            cookieStore.set('turso_url', tursoUrl, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 365, // 1 year
                path: '/',
            });
            cookieStore.set('turso_token', tursoToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 365,
                path: '/',
            });
        }

        // Count total tables
        const tablesResult = await client.execute("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
        const totalTables = Number(tablesResult.rows[0]?.count) || 0;

        return NextResponse.json({
            success: true,
            message: `Database berhasil diinisialisasi! ${totalTables} tabel tersedia.`,
            data: { tablesCreated, totalTables }
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Gagal inisialisasi database' },
            { status: 500 }
        );
    }
}

// GET - Check current database status
export async function GET() {
    try {
        const cookieStore = await cookies();
        const tursoUrl = cookieStore.get('turso_url')?.value;
        const tursoToken = cookieStore.get('turso_token')?.value;

        if (!tursoUrl || !tursoToken) {
            return NextResponse.json({
                success: true,
                connected: false,
                message: 'Database belum dikonfigurasi'
            });
        }

        const client = createClient({ url: tursoUrl, authToken: tursoToken });
        await client.execute('SELECT 1');

        // Get stats
        const [products, customers, transactions] = await Promise.all([
            client.execute('SELECT COUNT(*) as count FROM products'),
            client.execute('SELECT COUNT(*) as count FROM customers'),
            client.execute('SELECT COUNT(*) as count FROM transactions'),
        ]);

        return NextResponse.json({
            success: true,
            connected: true,
            stats: {
                products: Number(products.rows[0]?.count) || 0,
                customers: Number(customers.rows[0]?.count) || 0,
                transactions: Number(transactions.rows[0]?.count) || 0,
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: true,
            connected: false,
            message: error instanceof Error ? error.message : 'Tidak dapat terhubung ke database'
        });
    }
}
