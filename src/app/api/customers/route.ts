// API Route: Customers CRUD Operations
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

function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export async function GET(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const search = searchParams.get('search');

        let sql = 'SELECT * FROM customers';
        const args: string[] = [];

        if (id) {
            sql += ' WHERE id = ?';
            args.push(id);
        } else if (search) {
            sql += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
            args.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        sql += ' ORDER BY created_at DESC';

        const result = await client.execute({ sql, args });

        if (id && result.rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Pelanggan tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: id ? result.rows[0] : result.rows });
    } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Gagal mengambil data' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, phone, address, notes, customFields } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Nama pelanggan diperlukan' }, { status: 400 });
        }

        const id = generateId();
        const now = new Date().toISOString();

        await client.execute({
            sql: `INSERT INTO customers (id, name, email, phone, address, notes, custom_fields, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [id, name, email || null, phone || null, address || null, notes || null, customFields ? JSON.stringify(customFields) : null, now, now],
        });

        return NextResponse.json({ success: true, message: 'Pelanggan berhasil ditambahkan', data: { id } });
    } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Gagal menambah pelanggan' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const body = await request.json();
        const { id, name, email, phone, address, notes, customFields } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID pelanggan diperlukan' }, { status: 400 });
        }

        const now = new Date().toISOString();

        await client.execute({
            sql: `UPDATE customers SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), address = COALESCE(?, address), notes = COALESCE(?, notes), custom_fields = COALESCE(?, custom_fields), updated_at = ? WHERE id = ?`,
            args: [name || null, email || null, phone || null, address || null, notes || null, customFields ? JSON.stringify(customFields) : null, now, id],
        });

        return NextResponse.json({ success: true, message: 'Pelanggan berhasil diperbarui' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID pelanggan diperlukan' }, { status: 400 });
        }

        await client.execute({ sql: 'DELETE FROM customers WHERE id = ?', args: [id] });

        return NextResponse.json({ success: true, message: 'Pelanggan berhasil dihapus' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Gagal menghapus' }, { status: 500 });
    }
}
