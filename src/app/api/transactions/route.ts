// API Route: Transactions CRUD with Items
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
        const type = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (id) {
            // Get single transaction with items
            const txResult = await client.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [id] });
            if (txResult.rows.length === 0) {
                return NextResponse.json({ success: false, message: 'Transaksi tidak ditemukan' }, { status: 404 });
            }

            const itemsResult = await client.execute({ sql: 'SELECT * FROM transaction_items WHERE transaction_id = ?', args: [id] });

            return NextResponse.json({
                success: true,
                data: { ...txResult.rows[0], items: itemsResult.rows }
            });
        }

        let sql = 'SELECT t.*, c.name as customer_name FROM transactions t LEFT JOIN customers c ON t.customer_id = c.id';
        const conditions: string[] = [];
        const args: string[] = [];

        if (type) {
            conditions.push('t.type = ?');
            args.push(type);
        }
        if (startDate) {
            conditions.push('t.created_at >= ?');
            args.push(startDate);
        }
        if (endDate) {
            conditions.push('t.created_at <= ?');
            args.push(endDate);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY t.created_at DESC LIMIT 100';

        const result = await client.execute({ sql, args });
        return NextResponse.json({ success: true, data: result.rows });
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
        const { type, customerId, supplierId, items, tax, discount, paymentMethod, paymentStatus, dueDate, paidAmount, notes } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, message: 'Items diperlukan' }, { status: 400 });
        }

        const transactionId = generateId();
        const now = new Date().toISOString();

        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.price * item.quantity;
        }
        const taxAmount = tax || 0;
        const discountAmount = discount || 0;
        const total = subtotal + taxAmount - discountAmount;

        // Handle credit payment
        const finalPaymentStatus = paymentStatus || 'paid';
        const finalPaidAmount = finalPaymentStatus === 'paid' ? total : (paidAmount || 0);

        // Insert transaction
        await client.execute({
            sql: `INSERT INTO transactions (id, type, customer_id, supplier_id, subtotal, tax, discount, total, paid_amount, payment_method, payment_status, due_date, status, notes, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
            args: [
                transactionId,
                type || 'sale',
                customerId || null,
                supplierId || null,
                subtotal,
                taxAmount,
                discountAmount,
                total,
                finalPaidAmount,
                paymentMethod || 'cash',
                finalPaymentStatus,
                dueDate || null,
                notes || null,
                now,
                now
            ],
        });

        // Insert items and update stock
        for (const item of items) {
            const itemId = generateId();
            await client.execute({
                sql: `INSERT INTO transaction_items (id, transaction_id, product_id, product_name, quantity, price, subtotal, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [itemId, transactionId, item.productId, item.productName, item.quantity, item.price, item.price * item.quantity, now],
            });

            // Update stock based on transaction type
            if (type === 'sale' || type === 'return') {
                const stockChange = type === 'sale' ? -item.quantity : item.quantity;
                await client.execute({
                    sql: 'UPDATE products SET stock = stock + ? WHERE id = ?',
                    args: [stockChange, item.productId],
                });
            } else if (type === 'purchase') {
                await client.execute({
                    sql: 'UPDATE products SET stock = stock + ? WHERE id = ?',
                    args: [item.quantity, item.productId],
                });
            }
        }

        // If partial payment, record the initial payment
        if (finalPaymentStatus !== 'paid' && finalPaidAmount > 0) {
            const paymentId = generateId();
            await client.execute({
                sql: `INSERT INTO credit_payments (id, transaction_id, amount, payment_method, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
                args: [paymentId, transactionId, finalPaidAmount, paymentMethod || 'cash', 'Pembayaran awal', now],
            });
        }

        return NextResponse.json({
            success: true,
            message: finalPaymentStatus === 'paid' ? 'Transaksi berhasil disimpan' : 'Transaksi kredit berhasil dicatat',
            data: {
                id: transactionId,
                total,
                paid: finalPaidAmount,
                remaining: total - finalPaidAmount,
                paymentStatus: finalPaymentStatus
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Gagal menyimpan transaksi' }, { status: 500 });
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
            return NextResponse.json({ success: false, message: 'ID transaksi diperlukan' }, { status: 400 });
        }

        // Delete items first (cascade should handle this but just in case)
        await client.execute({ sql: 'DELETE FROM transaction_items WHERE transaction_id = ?', args: [id] });
        await client.execute({ sql: 'DELETE FROM transactions WHERE id = ?', args: [id] });

        return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' });
    } catch (error) {
        return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Gagal menghapus' }, { status: 500 });
    }
}
