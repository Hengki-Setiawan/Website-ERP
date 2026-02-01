// API Route: Settings CRUD
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { cookies } from 'next/headers';

async function getDbClient() {
    const cookieStore = await cookies();
    const tursoUrl = cookieStore.get('turso_url')?.value;
    const tursoToken = cookieStore.get('turso_token')?.value;
    if (!tursoUrl || !tursoToken) return null;
    return createClient({ url: tursoUrl, authToken: tursoToken });
}

// GET - Get all settings or specific category
export async function GET(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: true, data: [], message: 'Database tidak terkonfigurasi' });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        let sql = 'SELECT * FROM settings';
        const args: string[] = [];

        if (category) {
            sql += ' WHERE category = ?';
            args.push(category);
        }
        sql += ' ORDER BY key';

        const result = await client.execute({ sql, args });

        // Convert to key-value object
        const settings: Record<string, string> = {};
        for (const row of result.rows) {
            settings[row.key as string] = row.value as string;
        }

        return NextResponse.json({ success: true, data: settings });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengambil settings'
        }, { status: 500 });
    }
}

// POST - Save/Update settings
export async function POST(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const body = await request.json();
        const { settings, category } = body;

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ success: false, message: 'Settings diperlukan' }, { status: 400 });
        }

        const now = new Date().toISOString();

        // Upsert each setting
        for (const [key, value] of Object.entries(settings)) {
            await client.execute({
                sql: `INSERT INTO settings (key, value, category, updated_at) 
              VALUES (?, ?, ?, ?)
              ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
                args: [key, String(value), category || 'general', now, String(value), now]
            });
        }

        return NextResponse.json({ success: true, message: 'Settings berhasil disimpan' });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal menyimpan settings'
        }, { status: 500 });
    }
}
