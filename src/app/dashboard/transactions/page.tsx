'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    Receipt,
    Calendar,
    DollarSign,
    Eye,
    Loader2,
    ArrowUpRight,
    ArrowDownLeft,
    Filter
} from 'lucide-react';

interface Transaction {
    id: string;
    type: string;
    customer_name: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function TransactionsPage() {
    const { settings } = useSettingsStore();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [error, setError] = useState('');

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (typeFilter) params.set('type', typeFilter);
            if (dateFilter) {
                const start = new Date(dateFilter);
                const end = new Date(dateFilter);
                end.setDate(end.getDate() + 1);
                params.set('startDate', start.toISOString());
                params.set('endDate', end.toISOString());
            }

            const res = await fetch(`/api/transactions?${params}`);
            const data = await res.json();

            if (data.success) {
                setTransactions(data.data || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal memuat transaksi');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, [typeFilter, dateFilter]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTypeLabel = (type: string) => {
        const types: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
            sale: { label: 'Penjualan', color: 'text-green-600 bg-green-100 dark:bg-green-900/30', icon: ArrowUpRight },
            purchase: { label: 'Pembelian', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', icon: ArrowDownLeft },
            return: { label: 'Retur', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30', icon: ArrowDownLeft },
        };
        return types[type] || { label: type, color: 'text-gray-600 bg-gray-100', icon: Receipt };
    };

    const getPaymentLabel = (method: string) => {
        const methods: Record<string, string> = {
            cash: '💵 Tunai',
            card: '💳 Kartu',
            qris: '📱 QRIS',
            transfer: '🏦 Transfer',
        };
        return methods[method] || method;
    };

    // Calculate summary
    const summary = {
        total: transactions.length,
        sales: transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.total, 0),
        purchases: transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.total, 0),
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Receipt className="text-blue-500" /> Transaksi
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Riwayat semua transaksi
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Penjualan</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.sales)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pembelian</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.purchases)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="">Semua Tipe</option>
                        <option value="sale">Penjualan</option>
                        <option value="purchase">Pembelian</option>
                        <option value="return">Retur</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    {dateFilter && (
                        <button
                            onClick={() => setDateFilter('')}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20">
                        <Receipt className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">Belum ada transaksi</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tipe</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pelanggan</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pembayaran</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {transactions.map((tx) => {
                                    const typeInfo = getTypeLabel(tx.type);
                                    const TypeIcon = typeInfo.icon;

                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(tx.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                    <TypeIcon size={12} />
                                                    {typeInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {tx.customer_name || 'Umum'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {getPaymentLabel(tx.payment_method)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(tx.total)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'completed'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : tx.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {tx.status === 'completed' ? 'Selesai' : tx.status === 'pending' ? 'Pending' : 'Batal'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
