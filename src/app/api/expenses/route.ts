// API Route: Expenses CRUD
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

// GET - List expenses
export async function GET(request: NextRequest) {
    try {
        const client = await getDbClient();
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let sql = 'SELECT * FROM expenses WHERE 1=1';
        const args: string[] = [];

        if (category) {
            sql += ' AND category = ?';
            args.push(category);
        }

        if (startDate) {
            sql += ' AND expense_date >= ?';
            args.push(startDate);
        }

        if (endDate) {
            sql += ' AND expense_date <= ?';
            args.push(endDate);
        }

        sql += ' ORDER BY expense_date DESC, created_at DESC';

        const result = await client.execute({ sql, args });

        // Get total
        const totalResult = await client.execute({
            sql: sql.replace('SELECT *', 'SELECT SUM(amount) as total'),
            args
        });

        return NextResponse.json({
            success: true,
            data: result.rows,
            total: Number(totalResult.rows[0]?.total) || 0
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengambil pengeluaran'
        }, { status: 500 });
    }
}

// POST - Create expense
export async function POST(request: NextRequest) {
    try {
        const client = await getDbClient();
        const body = await request.json();
        const { description, amount, category, expenseDate, paymentMethod, receipt, notes } = body;

        if (!description || !amount) {
            return NextResponse.json({ success: false, message: 'Deskripsi dan jumlah diperlukan' }, { status: 400 });
        }

        const id = generateId();
        const now = new Date().toISOString();

        await client.execute({
            sql: `INSERT INTO expenses (id, description, amount, category, expense_date, payment_method, receipt, notes, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                description,
                parseFloat(amount),
                category || 'operasional',
                expenseDate || now.split('T')[0],
                paymentMethod || 'cash',
                receipt || null,
                notes || null,
                now,
                now
            ]
        });

        return NextResponse.json({
            success: true,
            message: 'Pengeluaran berhasil dicatat',
            data: { id }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mencatat pengeluaran'
        }, { status: 500 });
    }
}

// PUT - Update expense
export async function PUT(request: NextRequest) {
    try {
        const client = await getDbClient();
        const body = await request.json();
        const { id, description, amount, category, expenseDate, paymentMethod, receipt, notes } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID pengeluaran diperlukan' }, { status: 400 });
        }

        const now = new Date().toISOString();

        await client.execute({
            sql: `UPDATE expenses SET 
            description = COALESCE(?, description), 
            amount = COALESCE(?, amount), 
            category = COALESCE(?, category), 
            expense_date = COALESCE(?, expense_date),
            payment_method = COALESCE(?, payment_method),
            receipt = COALESCE(?, receipt),
            notes = COALESCE(?, notes),
            updated_at = ? 
            WHERE id = ?`,
            args: [description || null, amount ? parseFloat(amount) : null, category || null, expenseDate || null, paymentMethod || null, receipt || null, notes || null, now, id]
        });

        return NextResponse.json({ success: true, message: 'Pengeluaran berhasil diupdate' });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengupdate pengeluaran'
        }, { status: 500 });
    }
}

// DELETE - Delete expense
export async function DELETE(request: NextRequest) {
    try {
        const client = await getDbClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID pengeluaran diperlukan' }, { status: 400 });
        }

        await client.execute({ sql: 'DELETE FROM expenses WHERE id = ?', args: [id] });

        return NextResponse.json({ success: true, message: 'Pengeluaran berhasil dihapus' });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal menghapus pengeluaran'
        }, { status: 500 });
    }
}
