// API Route: Credits (Hutang/Piutang)
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

// GET - List unpaid/partial transactions (credits)
export async function GET(request: NextRequest) {
    try {
        const client = await getDbClient();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'unpaid', 'partial', 'all'
        const customerId = searchParams.get('customerId');
        const overdue = searchParams.get('overdue') === 'true';

        let sql = `
      SELECT t.*, c.name as customer_name, c.phone as customer_phone
      FROM transactions t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.payment_status != 'paid'
    `;
        const args: string[] = [];

        if (status && status !== 'all') {
            sql += ' AND t.payment_status = ?';
            args.push(status);
        }

        if (customerId) {
            sql += ' AND t.customer_id = ?';
            args.push(customerId);
        }

        if (overdue) {
            sql += " AND t.due_date < date('now')";
        }

        sql += ' ORDER BY t.due_date ASC, t.created_at DESC';

        const result = await client.execute({ sql, args });

        // Calculate totals
        const totalResult = await client.execute({
            sql: `SELECT 
            COUNT(*) as count,
            COALESCE(SUM(total - paid_amount), 0) as total_unpaid
            FROM transactions 
            WHERE payment_status != 'paid'`,
            args: []
        });

        // Get overdue count
        const overdueResult = await client.execute({
            sql: `SELECT COUNT(*) as count 
            FROM transactions 
            WHERE payment_status != 'paid' AND due_date < date('now')`,
            args: []
        });

        return NextResponse.json({
            success: true,
            data: result.rows,
            summary: {
                count: Number(totalResult.rows[0]?.count) || 0,
                totalUnpaid: Number(totalResult.rows[0]?.total_unpaid) || 0,
                overdueCount: Number(overdueResult.rows[0]?.count) || 0
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengambil data hutang'
        }, { status: 500 });
    }
}

// POST - Add payment to a credit transaction
export async function POST(request: NextRequest) {
    try {
        const client = await getDbClient();
        const body = await request.json();
        const { transactionId, amount, paymentMethod, notes } = body;

        if (!transactionId || !amount) {
            return NextResponse.json({
                success: false,
                message: 'Transaction ID dan jumlah pembayaran diperlukan'
            }, { status: 400 });
        }

        // Get current transaction
        const txResult = await client.execute({
            sql: 'SELECT * FROM transactions WHERE id = ?',
            args: [transactionId]
        });

        if (txResult.rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
        }

        const tx = txResult.rows[0];
        const currentPaid = Number(tx.paid_amount) || 0;
        const total = Number(tx.total) || 0;
        const remaining = total - currentPaid;

        if (amount > remaining) {
            return NextResponse.json({
                success: false,
                message: `Jumlah pembayaran melebihi sisa hutang (${remaining})`
            }, { status: 400 });
        }

        const paymentId = generateId();
        const now = new Date().toISOString();
        const newPaidAmount = currentPaid + amount;
        const newStatus = newPaidAmount >= total ? 'paid' : 'partial';

        // Insert payment record
        await client.execute({
            sql: `INSERT INTO credit_payments (id, transaction_id, amount, payment_method, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
            args: [paymentId, transactionId, amount, paymentMethod || 'cash', notes || null, now]
        });

        // Update transaction
        await client.execute({
            sql: `UPDATE transactions SET paid_amount = ?, payment_status = ?, updated_at = ? WHERE id = ?`,
            args: [newPaidAmount, newStatus, now, transactionId]
        });

        return NextResponse.json({
            success: true,
            message: newStatus === 'paid' ? 'Hutang telah lunas!' : 'Pembayaran berhasil dicatat',
            data: {
                paymentId,
                newPaidAmount,
                remaining: total - newPaidAmount,
                status: newStatus
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mencatat pembayaran'
        }, { status: 500 });
    }
}

// PUT - Get payment history for a transaction
export async function PUT(request: NextRequest) {
    try {
        const client = await getDbClient();
        const body = await request.json();
        const { transactionId } = body;

        if (!transactionId) {
            return NextResponse.json({ success: false, message: 'Transaction ID diperlukan' }, { status: 400 });
        }

        const result = await client.execute({
            sql: 'SELECT * FROM credit_payments WHERE transaction_id = ? ORDER BY created_at DESC',
            args: [transactionId]
        });

        return NextResponse.json({ success: true, data: result.rows });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengambil riwayat pembayaran'
        }, { status: 500 });
    }
}
