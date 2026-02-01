// API Route: Export to Excel/CSV
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

export async function GET(request: NextRequest) {
    try {
        const client = await getDbClient();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'transactions', 'products', 'expenses', 'customers'
        const format = searchParams.get('format') || 'csv';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let data: Record<string, unknown>[] = [];
        let headers: string[] = [];
        let filename = '';

        switch (type) {
            case 'transactions': {
                let sql = `
          SELECT 
            t.id,
            t.type,
            c.name as customer_name,
            t.subtotal,
            t.tax,
            t.discount,
            t.total,
            t.paid_amount,
            t.payment_status,
            t.payment_method,
            t.due_date,
            t.status,
            t.notes,
            t.created_at
          FROM transactions t
          LEFT JOIN customers c ON t.customer_id = c.id
          WHERE 1=1
        `;
                const args: string[] = [];

                if (startDate) {
                    sql += ' AND t.created_at >= ?';
                    args.push(startDate);
                }
                if (endDate) {
                    sql += ' AND t.created_at <= ?';
                    args.push(endDate);
                }
                sql += ' ORDER BY t.created_at DESC';

                const result = await client.execute({ sql, args });
                data = result.rows as Record<string, unknown>[];
                headers = ['ID', 'Tipe', 'Pelanggan', 'Subtotal', 'Pajak', 'Diskon', 'Total', 'Dibayar', 'Status Bayar', 'Metode', 'Jatuh Tempo', 'Status', 'Catatan', 'Tanggal'];
                filename = `transaksi_${new Date().toISOString().split('T')[0]}`;
                break;
            }

            case 'products': {
                const result = await client.execute(`
          SELECT id, sku, name, description, price, cost, stock, min_stock, created_at
          FROM products ORDER BY name ASC
        `);
                data = result.rows as Record<string, unknown>[];
                headers = ['ID', 'SKU', 'Nama', 'Deskripsi', 'Harga', 'HPP', 'Stok', 'Min Stok', 'Dibuat'];
                filename = `produk_${new Date().toISOString().split('T')[0]}`;
                break;
            }

            case 'expenses': {
                let sql = `
          SELECT id, description, amount, category, expense_date, payment_method, notes, created_at
          FROM expenses WHERE 1=1
        `;
                const args: string[] = [];

                if (startDate) {
                    sql += ' AND expense_date >= ?';
                    args.push(startDate);
                }
                if (endDate) {
                    sql += ' AND expense_date <= ?';
                    args.push(endDate);
                }
                sql += ' ORDER BY expense_date DESC';

                const result = await client.execute({ sql, args });
                data = result.rows as Record<string, unknown>[];
                headers = ['ID', 'Deskripsi', 'Jumlah', 'Kategori', 'Tanggal', 'Metode Bayar', 'Catatan', 'Dibuat'];
                filename = `pengeluaran_${new Date().toISOString().split('T')[0]}`;
                break;
            }

            case 'customers': {
                const result = await client.execute(`
          SELECT id, name, email, phone, address, notes, created_at
          FROM customers ORDER BY name ASC
        `);
                data = result.rows as Record<string, unknown>[];
                headers = ['ID', 'Nama', 'Email', 'Telepon', 'Alamat', 'Catatan', 'Dibuat'];
                filename = `pelanggan_${new Date().toISOString().split('T')[0]}`;
                break;
            }

            case 'credits': {
                const result = await client.execute(`
          SELECT 
            t.id,
            c.name as customer_name,
            c.phone as customer_phone,
            t.total,
            t.paid_amount,
            (t.total - t.paid_amount) as remaining,
            t.payment_status,
            t.due_date,
            t.created_at
          FROM transactions t
          LEFT JOIN customers c ON t.customer_id = c.id
          WHERE t.payment_status != 'paid'
          ORDER BY t.due_date ASC
        `);
                data = result.rows as Record<string, unknown>[];
                headers = ['ID', 'Pelanggan', 'Telepon', 'Total', 'Dibayar', 'Sisa', 'Status', 'Jatuh Tempo', 'Tanggal'];
                filename = `hutang_${new Date().toISOString().split('T')[0]}`;
                break;
            }

            default:
                return NextResponse.json({ success: false, message: 'Tipe export tidak valid' }, { status: 400 });
        }

        if (format === 'csv') {
            // Generate CSV
            const csvRows = [headers.join(',')];

            for (const row of data) {
                const values = Object.values(row).map(val => {
                    if (val === null || val === undefined) return '';
                    const str = String(val);
                    // Escape quotes and wrap in quotes if contains comma
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                });
                csvRows.push(values.join(','));
            }

            const csv = csvRows.join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}.csv"`,
                },
            });
        }

        // Return JSON for xlsx generation on client side
        return NextResponse.json({
            success: true,
            data,
            headers,
            filename
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal export data'
        }, { status: 500 });
    }
}
