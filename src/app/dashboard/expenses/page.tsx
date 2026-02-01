'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    Plus,
    Wallet,
    Calendar,
    Loader2,
    X,
    Save,
    Trash2,
    Filter,
    TrendingDown
} from 'lucide-react';

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    expense_date: string;
    payment_method: string;
    notes: string;
    created_at: string;
}

const CATEGORIES = [
    { value: 'operasional', label: 'Operasional', color: 'bg-blue-500' },
    { value: 'gaji', label: 'Gaji & SDM', color: 'bg-green-500' },
    { value: 'utilitas', label: 'Utilitas', color: 'bg-yellow-500' },
    { value: 'marketing', label: 'Marketing', color: 'bg-purple-500' },
    { value: 'transport', label: 'Transport', color: 'bg-orange-500' },
    { value: 'lainnya', label: 'Lainnya', color: 'bg-gray-500' },
];

export default function ExpensesPage() {
    const { settings } = useSettingsStore();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        description: '',
        amount: '',
        category: 'operasional',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
        notes: '',
    });

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.set('category', categoryFilter);
            if (dateFilter) {
                const start = new Date(dateFilter);
                const end = new Date(dateFilter);
                end.setMonth(end.getMonth() + 1);
                params.set('startDate', start.toISOString().split('T')[0]);
                params.set('endDate', end.toISOString().split('T')[0]);
            }

            const res = await fetch(`/api/expenses?${params}`);
            const data = await res.json();

            if (data.success) {
                setExpenses(data.data || []);
                setTotal(data.total || 0);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal memuat pengeluaran');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [categoryFilter, dateFilter]);

    const openModal = (expense?: Expense) => {
        if (expense) {
            setEditingExpense(expense);
            setForm({
                description: expense.description,
                amount: String(expense.amount),
                category: expense.category,
                expenseDate: expense.expense_date,
                paymentMethod: expense.payment_method,
                notes: expense.notes || '',
            });
        } else {
            setEditingExpense(null);
            setForm({
                description: '',
                amount: '',
                category: 'operasional',
                expenseDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'cash',
                notes: '',
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.description || !form.amount) {
            setError('Deskripsi dan jumlah diperlukan');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const method = editingExpense ? 'PUT' : 'POST';
            const body = {
                ...(editingExpense && { id: editingExpense.id }),
                ...form,
            };

            const res = await fetch('/api/expenses', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                fetchExpenses();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal menyimpan pengeluaran');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return;

        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                fetchExpenses();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal menghapus pengeluaran');
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[5];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Wallet className="text-red-500" /> Pengeluaran
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Catat dan kelola pengeluaran bisnis
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                >
                    <Plus size={20} />
                    Catat Pengeluaran
                </button>
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 mb-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/80 text-sm">Total Pengeluaran</p>
                        <p className="text-3xl font-bold mt-1">{formatCurrency(total)}</p>
                        <p className="text-white/70 text-sm mt-1">{expenses.length} transaksi</p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <TrendingDown size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="">Semua Kategori</option>
                        {CATEGORIES.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-400" />
                    <input
                        type="month"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Expenses List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="text-center py-20">
                        <Wallet className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">Belum ada pengeluaran dicatat</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {expenses.map((expense) => {
                            const catInfo = getCategoryInfo(expense.category);
                            return (
                                <div key={expense.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl ${catInfo.color} flex items-center justify-center text-white`}>
                                        <Wallet size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white">{expense.description}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <span className={`px-2 py-0.5 rounded-full text-xs ${catInfo.color} text-white`}>{catInfo.label}</span>
                                            <span>•</span>
                                            <span>{new Date(expense.expense_date).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                                        <p className="text-xs text-gray-500">{expense.payment_method === 'cash' ? 'Tunai' : expense.payment_method === 'transfer' ? 'Transfer' : 'Kartu'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingExpense ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi *</label>
                                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Contoh: Bayar listrik bulan ini" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah *</label>
                                    <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tanggal</label>
                                    <input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori</label>
                                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pembayaran</label>
                                    <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                        <option value="cash">Tunai</option>
                                        <option value="transfer">Transfer</option>
                                        <option value="card">Kartu</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catatan</label>
                                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Catatan tambahan" />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Batal</button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}>
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
