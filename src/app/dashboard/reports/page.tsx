'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Users,
    Calendar,
    Loader2,
    AlertTriangle,
    ArrowRight
} from 'lucide-react';

interface Summary {
    sales: { count: number; total: number };
    expenses: { count: number; total: number };
    profit: number;
    products: number;
    customers: number;
    period: { start: string; end: string };
}

interface TopProduct {
    id: string;
    name: string;
    qty_sold: number;
    revenue: number;
}

interface TopCustomer {
    id: string;
    name: string;
    tx_count: number;
    total_spent: number;
}

interface ExpenseCategory {
    category: string;
    count: number;
    total: number;
}

interface LowStock {
    id: string;
    name: string;
    stock: number;
    min_stock: number;
}

export default function ReportsPage() {
    const { settings } = useSettingsStore();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [summary, setSummary] = useState<Summary | null>(null);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [lowStock, setLowStock] = useState<LowStock[]>([]);
    const [error, setError] = useState('');

    const fetchReports = async () => {
        setLoading(true);
        try {
            const [year, month] = period.split('-');
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

            const params = `startDate=${startDate}&endDate=${endDate}`;

            const [summaryRes, productsRes, customersRes, expCatRes, lowStockRes] = await Promise.all([
                fetch(`/api/reports?type=summary&${params}`),
                fetch(`/api/reports?type=top-products&${params}`),
                fetch(`/api/reports?type=top-customers&${params}`),
                fetch(`/api/reports?type=expenses-by-category&${params}`),
                fetch(`/api/reports?type=low-stock`),
            ]);

            const [summaryData, productsData, customersData, expCatData, lowStockData] = await Promise.all([
                summaryRes.json(),
                productsRes.json(),
                customersRes.json(),
                expCatRes.json(),
                lowStockRes.json(),
            ]);

            if (summaryData.success) setSummary(summaryData.data);
            if (productsData.success) setTopProducts(productsData.data || []);
            if (customersData.success) setTopCustomers(customersData.data || []);
            if (expCatData.success) setExpenseCategories(expCatData.data || []);
            if (lowStockData.success) setLowStock(lowStockData.data || []);
        } catch (err) {
            setError('Gagal memuat laporan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [period]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getCategoryLabel = (cat: string) => {
        const labels: Record<string, string> = {
            operasional: 'Operasional',
            gaji: 'Gaji & SDM',
            utilitas: 'Utilitas',
            marketing: 'Marketing',
            transport: 'Transport',
            lainnya: 'Lainnya',
        };
        return labels[cat] || cat;
    };

    const periodLabel = () => {
        const [year, month] = period.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="text-blue-500" /> Laporan
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Analisis performa bisnis Anda
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp size={24} />
                        <span className="text-sm opacity-80">{periodLabel()}</span>
                    </div>
                    <p className="text-white/80 text-sm">Penjualan</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary?.sales.total || 0)}</p>
                    <p className="text-sm opacity-80 mt-1">{summary?.sales.count || 0} transaksi</p>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingDown size={24} />
                        <span className="text-sm opacity-80">{periodLabel()}</span>
                    </div>
                    <p className="text-white/80 text-sm">Pengeluaran</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary?.expenses.total || 0)}</p>
                    <p className="text-sm opacity-80 mt-1">{summary?.expenses.count || 0} transaksi</p>
                </div>

                <div className={`rounded-2xl p-6 text-white ${(summary?.profit || 0) >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <DollarSign size={24} />
                        <span className="text-sm opacity-80">{periodLabel()}</span>
                    </div>
                    <p className="text-white/80 text-sm">Laba Bersih</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary?.profit || 0)}</p>
                    <p className="text-sm opacity-80 mt-1">
                        {(summary?.profit || 0) >= 0 ? '✓ Untung' : '✗ Rugi'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Package size={20} className="text-blue-500" />
                        Produk Terlaris
                    </h3>
                    {topProducts.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Belum ada data</p>
                    ) : (
                        <div className="space-y-3">
                            {topProducts.slice(0, 5).map((product, i) => (
                                <div key={product.id} className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                                        <p className="text-sm text-gray-500">{product.qty_sold} terjual</p>
                                    </div>
                                    <p className="font-semibold text-green-600">{formatCurrency(Number(product.revenue))}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Customers */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-green-500" />
                        Pelanggan Teratas
                    </h3>
                    {topCustomers.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Belum ada data</p>
                    ) : (
                        <div className="space-y-3">
                            {topCustomers.slice(0, 5).map((customer, i) => (
                                <div key={customer.id} className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{customer.name}</p>
                                        <p className="text-sm text-gray-500">{customer.tx_count} transaksi</p>
                                    </div>
                                    <p className="font-semibold text-blue-600">{formatCurrency(Number(customer.total_spent))}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Expense by Category */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingDown size={20} className="text-red-500" />
                        Pengeluaran per Kategori
                    </h3>
                    {expenseCategories.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">Belum ada data</p>
                    ) : (
                        <div className="space-y-3">
                            {expenseCategories.map((cat) => {
                                const maxTotal = Math.max(...expenseCategories.map(c => Number(c.total)));
                                const pct = maxTotal > 0 ? (Number(cat.total) / maxTotal) * 100 : 0;
                                return (
                                    <div key={cat.category}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{getCategoryLabel(cat.category)}</span>
                                            <span className="text-sm font-semibold text-red-600">{formatCurrency(Number(cat.total))}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-400 to-orange-400 rounded-full"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-orange-500" />
                        Peringatan Stok Rendah
                    </h3>
                    {lowStock.length === 0 ? (
                        <p className="text-green-600 text-center py-8">✓ Semua stok aman</p>
                    ) : (
                        <div className="space-y-3">
                            {lowStock.slice(0, 5).map((product) => (
                                <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                                    <AlertTriangle size={18} className="text-orange-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                                        <p className="text-sm text-orange-600">Stok: {product.stock} (min: {product.min_stock})</p>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-400" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
