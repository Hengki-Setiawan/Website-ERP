'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import {
    Package,
    Users,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    AlertTriangle,
    ArrowUpRight,
    Loader2,
    Database,
    ExternalLink
} from 'lucide-react';
import { useSettingsStore } from '@/lib/store';
import Link from 'next/link';

interface DashboardStats {
    totalProducts: number;
    totalCustomers: number;
    todaySales: number;
    todayTransactions: number;
    monthSales: number;
    monthTransactions: number;
    lowStockProducts: Array<{ id: string; name: string; stock: number; min_stock: number }>;
    recentTransactions: Array<{ id: string; total: number; created_at: string; customer_name: string; payment_method: string }>;
}

function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    href
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    href?: string;
}) {
    const content = (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl text-white ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return content;
}

export default function DashboardPage() {
    const { settings } = useSettingsStore();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();

                if (data.success) {
                    setStats(data.data);
                    setIsDemo(data.demo);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam lalu`;
        return date.toLocaleDateString('id-ID');
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Dashboard
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Selamat datang di {settings.businessName || 'ERP UMKM'}
                </p>
            </div>

            {/* Database Setup Notice */}
            {isDemo && (
                <div className="mb-6 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-3">
                        <Database className="text-yellow-600 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-medium text-yellow-800 dark:text-yellow-400">Database Belum Terkonfigurasi</h3>
                            <p className="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                                Untuk menyimpan data produk, pelanggan, dan transaksi, silakan setup database Turso gratis.
                            </p>
                            <Link
                                href="/dashboard/database"
                                className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 hover:underline"
                            >
                                <ExternalLink size={14} />
                                Setup Database Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Produk"
                    value={stats?.totalProducts?.toString() || '0'}
                    icon={Package}
                    color="bg-blue-500"
                    href="/dashboard/products"
                />
                <StatsCard
                    title="Total Pelanggan"
                    value={stats?.totalCustomers?.toString() || '0'}
                    icon={Users}
                    color="bg-green-500"
                    href="/dashboard/customers"
                />
                <StatsCard
                    title="Penjualan Hari Ini"
                    value={formatCurrency(stats?.todaySales || 0)}
                    subtitle={`${stats?.todayTransactions || 0} transaksi`}
                    icon={TrendingUp}
                    color="bg-purple-500"
                    href="/dashboard/transactions"
                />
                <StatsCard
                    title="Omset Bulan Ini"
                    value={formatCurrency(stats?.monthSales || 0)}
                    subtitle={`${stats?.monthTransactions || 0} transaksi`}
                    icon={DollarSign}
                    color="bg-orange-500"
                    href="/dashboard/transactions"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Aksi Cepat
                    </h2>

                    <Link
                        href="/dashboard/pos"
                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                    >
                        <div className="p-3 rounded-xl bg-blue-500 text-white">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Penjualan Baru</p>
                            <p className="text-sm text-gray-500">Buat transaksi penjualan</p>
                        </div>
                        <ArrowUpRight className="ml-auto text-gray-400" size={20} />
                    </Link>

                    <Link
                        href="/dashboard/products"
                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
                    >
                        <div className="p-3 rounded-xl bg-green-500 text-white">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Tambah Produk</p>
                            <p className="text-sm text-gray-500">Tambah produk baru</p>
                        </div>
                        <ArrowUpRight className="ml-auto text-gray-400" size={20} />
                    </Link>

                    {(stats?.lowStockProducts?.length || 0) > 0 && (
                        <Link
                            href="/dashboard/products?lowStock=true"
                            className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all"
                        >
                            <div className="p-3 rounded-xl bg-orange-500 text-white">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <p className="font-medium text-orange-800 dark:text-orange-400">Stok Rendah</p>
                                <p className="text-sm text-orange-600 dark:text-orange-500">{stats?.lowStockProducts?.length} produk perlu restock</p>
                            </div>
                            <ArrowUpRight className="ml-auto text-orange-400" size={20} />
                        </Link>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Transaksi Terbaru
                        </h2>
                        <Link
                            href="/dashboard/transactions"
                            className="text-sm font-medium hover:underline"
                            style={{ color: settings.primaryColor }}
                        >
                            Lihat Semua
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {!stats?.recentTransactions?.length ? (
                            <div className="text-center py-12 text-gray-400">
                                <ShoppingCart className="mx-auto mb-2" size={32} />
                                <p>Belum ada transaksi</p>
                                <Link
                                    href="/dashboard/pos"
                                    className="inline-block mt-3 text-sm font-medium hover:underline"
                                    style={{ color: settings.primaryColor }}
                                >
                                    Buat Transaksi Pertama →
                                </Link>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pembayaran</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {stats.recentTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                {tx.customer_name || 'Umum'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white">
                                                {formatCurrency(tx.total)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {formatTime(tx.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {tx.payment_method === 'cash' ? '💵 Tunai' : tx.payment_method === 'card' ? '💳 Kartu' : '📱 QRIS'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Assistant Teaser */}
            <div
                className="mt-8 p-6 rounded-2xl text-white"
                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h3 className="text-xl font-bold mb-2">🤖 Asisten AI</h3>
                        <p className="opacity-90">
                            Tanyakan apa saja tentang bisnis Anda! AI dapat membantu menganalisis penjualan, stok, dan memberikan rekomendasi.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/ai"
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors"
                    >
                        Mulai Chat
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
