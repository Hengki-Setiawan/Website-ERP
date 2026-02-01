// API Route: Reports
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
        const type = searchParams.get('type') || 'summary';
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Get date range (default: current month)
        const now = new Date();
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        const start = startDate || defaultStart;
        const end = endDate || defaultEnd;

        if (type === 'summary') {
            // Get summary stats
            const [salesResult, expensesResult, productsResult, customersResult] = await Promise.all([
                client.execute({
                    sql: `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
                FROM transactions 
                WHERE type = 'sale' AND created_at >= ? AND created_at <= ?`,
                    args: [start, end]
                }),
                client.execute({
                    sql: `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
                FROM expenses 
                WHERE expense_date >= ? AND expense_date <= ?`,
                    args: [start.split('T')[0], end.split('T')[0]]
                }),
                client.execute('SELECT COUNT(*) as count FROM products'),
                client.execute('SELECT COUNT(*) as count FROM customers'),
            ]);

            const sales = Number(salesResult.rows[0]?.total) || 0;
            const expenses = Number(expensesResult.rows[0]?.total) || 0;

            return NextResponse.json({
                success: true,
                data: {
                    sales: {
                        count: Number(salesResult.rows[0]?.count) || 0,
                        total: sales,
                    },
                    expenses: {
                        count: Number(expensesResult.rows[0]?.count) || 0,
                        total: expenses,
                    },
                    profit: sales - expenses,
                    products: Number(productsResult.rows[0]?.count) || 0,
                    customers: Number(customersResult.rows[0]?.count) || 0,
                    period: { start, end }
                }
            });
        }

        if (type === 'sales-by-day') {
            const result = await client.execute({
                sql: `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total) as total
              FROM transactions 
              WHERE type = 'sale' AND created_at >= ? AND created_at <= ?
              GROUP BY DATE(created_at)
              ORDER BY date ASC`,
                args: [start, end]
            });

            return NextResponse.json({ success: true, data: result.rows });
        }

        if (type === 'expenses-by-category') {
            const result = await client.execute({
                sql: `SELECT category, COUNT(*) as count, SUM(amount) as total
              FROM expenses 
              WHERE expense_date >= ? AND expense_date <= ?
              GROUP BY category
              ORDER BY total DESC`,
                args: [start.split('T')[0], end.split('T')[0]]
            });

            return NextResponse.json({ success: true, data: result.rows });
        }

        if (type === 'top-products') {
            const result = await client.execute({
                sql: `SELECT p.id, p.name, SUM(ti.quantity) as qty_sold, SUM(ti.subtotal) as revenue
              FROM transaction_items ti
              JOIN products p ON ti.product_id = p.id
              JOIN transactions t ON ti.transaction_id = t.id
              WHERE t.type = 'sale' AND t.created_at >= ? AND t.created_at <= ?
              GROUP BY p.id
              ORDER BY qty_sold DESC
              LIMIT 10`,
                args: [start, end]
            });

            return NextResponse.json({ success: true, data: result.rows });
        }

        if (type === 'top-customers') {
            const result = await client.execute({
                sql: `SELECT c.id, c.name, COUNT(t.id) as tx_count, SUM(t.total) as total_spent
              FROM transactions t
              JOIN customers c ON t.customer_id = c.id
              WHERE t.type = 'sale' AND t.created_at >= ? AND t.created_at <= ?
              GROUP BY c.id
              ORDER BY total_spent DESC
              LIMIT 10`,
                args: [start, end]
            });

            return NextResponse.json({ success: true, data: result.rows });
        }

        if (type === 'low-stock') {
            const result = await client.execute(
                'SELECT id, name, stock, min_stock FROM products WHERE stock <= min_stock ORDER BY stock ASC'
            );

            return NextResponse.json({ success: true, data: result.rows });
        }

        return NextResponse.json({ success: false, message: 'Tipe laporan tidak valid' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal generate laporan'
        }, { status: 500 });
    }
}
