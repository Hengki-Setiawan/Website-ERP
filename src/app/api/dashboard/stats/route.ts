// API Route: Dashboard Statistics
import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { cookies } from 'next/headers';

async function getDbClient() {
    const cookieStore = await cookies();
    const tursoUrl = cookieStore.get('turso_url')?.value;
    const tursoToken = cookieStore.get('turso_token')?.value;
    if (!tursoUrl || !tursoToken) return null;
    return createClient({ url: tursoUrl, authToken: tursoToken });
}

export async function GET() {
    try {
        const client = await getDbClient();

        if (!client) {
            // Return demo data if database not configured
            return NextResponse.json({
                success: true,
                demo: true,
                data: {
                    totalProducts: 0,
                    totalCustomers: 0,
                    todaySales: 0,
                    todayTransactions: 0,
                    monthSales: 0,
                    monthTransactions: 0,
                    lowStockProducts: [],
                    recentTransactions: [],
                }
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthISO = monthStart.toISOString();

        // Fetch all stats in parallel
        const [
            productsResult,
            customersResult,
            todaySalesResult,
            monthSalesResult,
            lowStockResult,
            recentTxResult
        ] = await Promise.all([
            client.execute('SELECT COUNT(*) as count FROM products'),
            client.execute('SELECT COUNT(*) as count FROM customers'),
            client.execute({
                sql: `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
              FROM transactions 
              WHERE type = 'sale' AND created_at >= ?`,
                args: [todayISO]
            }),
            client.execute({
                sql: `SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total 
              FROM transactions 
              WHERE type = 'sale' AND created_at >= ?`,
                args: [monthISO]
            }),
            client.execute('SELECT id, name, stock, min_stock FROM products WHERE stock <= min_stock ORDER BY stock ASC LIMIT 5'),
            client.execute({
                sql: `SELECT t.id, t.total, t.created_at, t.payment_method, c.name as customer_name
              FROM transactions t
              LEFT JOIN customers c ON t.customer_id = c.id
              WHERE t.type = 'sale'
              ORDER BY t.created_at DESC LIMIT 5`,
                args: []
            })
        ]);

        return NextResponse.json({
            success: true,
            demo: false,
            data: {
                totalProducts: Number(productsResult.rows[0]?.count) || 0,
                totalCustomers: Number(customersResult.rows[0]?.count) || 0,
                todaySales: Number(todaySalesResult.rows[0]?.total) || 0,
                todayTransactions: Number(todaySalesResult.rows[0]?.count) || 0,
                monthSales: Number(monthSalesResult.rows[0]?.total) || 0,
                monthTransactions: Number(monthSalesResult.rows[0]?.count) || 0,
                lowStockProducts: lowStockResult.rows,
                recentTransactions: recentTxResult.rows,
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal mengambil statistik',
            data: null
        }, { status: 500 });
    }
}
