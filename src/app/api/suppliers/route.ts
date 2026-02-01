// API Route: Suppliers CRUD
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { cookies } from 'next/headers';

async function getDbClient() {
    const cookieStore = await cookies();
    const tursoUrl = cookieStore.get('turso_url')?.value;
    const tursoToken = cookieStore.get('turso_token')?.value;
    if (!tursoUrl || !tursoToken) throw new Error('Database tidak terkonfigurasi');
    return createClient({ url: tursoUrl, authToken: tursoToken });
}

function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// GET - List suppliers
export async function GET(request: NextRequest) {
    try {
        const client = await getDbClient();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');

        let sql = 'SELECT * FROM suppliers';
        const args: string[] = [];

        if (search) {
            sql += ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ?';
            const searchTerm = `%${search}%`;
            args.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY name ASC';

        const result = await client.execute({ sql, args });
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengambil supplier'
        }, { status: 500 });
    }
}

// POST - Create supplier
export async function POST(request: NextRequest) {
    try {
        const client = await getDbClient();
        const body = await request.json();
        const { name, email, phone, address, notes, bankName, bankAccount } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Nama supplier diperlukan' }, { status: 400 });
        }

        const id = generateId();
        const now = new Date().toISOString();

        await client.execute({
            sql: `INSERT INTO suppliers (id, name, email, phone, address, notes, bank_name, bank_account, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [id, name, email || null, phone || null, address || null, notes || null, bankName || null, bankAccount || null, now, now]
        });

        return NextResponse.json({
            success: true,
            message: 'Supplier berhasil ditambahkan',
            data: { id }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal menambahkan supplier'
        }, { status: 500 });
    }
}

// PUT - Update supplier
export async function PUT(request: NextRequest) {
    try {
        const client = await getDbClient();
        const body = await request.json();
        const { id, name, email, phone, address, notes, bankName, bankAccount } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID supplier diperlukan' }, { status: 400 });
        }

        const now = new Date().toISOString();

        await client.execute({
            sql: `UPDATE suppliers SET 
            name = COALESCE(?, name), 
            email = COALESCE(?, email), 
            phone = COALESCE(?, phone), 
            address = COALESCE(?, address), 
            notes = COALESCE(?, notes),
            bank_name = COALESCE(?, bank_name),
            bank_account = COALESCE(?, bank_account),
            updated_at = ? 
            WHERE id = ?`,
            args: [name || null, email || null, phone || null, address || null, notes || null, bankName || null, bankAccount || null, now, id]
        });

        return NextResponse.json({ success: true, message: 'Supplier berhasil diupdate' });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengupdate supplier'
        }, { status: 500 });
    }
}

// DELETE - Delete supplier
export async function DELETE(request: NextRequest) {
    try {
        const client = await getDbClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID supplier diperlukan' }, { status: 400 });
        }

        await client.execute({ sql: 'DELETE FROM suppliers WHERE id = ?', args: [id] });

        return NextResponse.json({ success: true, message: 'Supplier berhasil dihapus' });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal menghapus supplier'
        }, { status: 500 });
    }
}
