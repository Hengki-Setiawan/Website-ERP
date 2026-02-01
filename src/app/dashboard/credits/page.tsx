'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    CreditCard,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    User,
    Phone,
    Calendar,
    Plus,
    X,
    Save,
    Eye
} from 'lucide-react';

interface Credit {
    id: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    paid_amount: number;
    payment_status: string;
    due_date: string;
    created_at: string;
}

interface Payment {
    id: string;
    amount: number;
    payment_method: string;
    notes: string;
    created_at: string;
}

export default function CreditsPage() {
    const { settings } = useSettingsStore();
    const [credits, setCredits] = useState<Credit[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showOverdue, setShowOverdue] = useState(false);
    const [summary, setSummary] = useState({ count: 0, totalUnpaid: 0, overdueCount: 0 });
    const [error, setError] = useState('');

    // Payment modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [saving, setSaving] = useState(false);

    // History modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchCredits = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.set('status', filter);
            if (showOverdue) params.set('overdue', 'true');

            const res = await fetch(`/api/credits?${params}`);
            const data = await res.json();

            if (data.success) {
                setCredits(data.data || []);
                setSummary(data.summary || { count: 0, totalUnpaid: 0, overdueCount: 0 });
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal memuat data hutang');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCredits();
    }, [filter, showOverdue]);

    const openPaymentModal = (credit: Credit) => {
        setSelectedCredit(credit);
        const remaining = credit.total - credit.paid_amount;
        setPaymentAmount(String(remaining));
        setPaymentMethod('cash');
        setPaymentNotes('');
        setShowPaymentModal(true);
    };

    const handlePayment = async () => {
        if (!selectedCredit || !paymentAmount) return;

        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactionId: selectedCredit.id,
                    amount: parseFloat(paymentAmount),
                    paymentMethod,
                    notes: paymentNotes,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setShowPaymentModal(false);
                fetchCredits();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal mencatat pembayaran');
        } finally {
            setSaving(false);
        }
    };

    const viewHistory = async (credit: Credit) => {
        setSelectedCredit(credit);
        setLoadingHistory(true);
        setShowHistoryModal(true);

        try {
            const res = await fetch('/api/credits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId: credit.id }),
            });

            const data = await res.json();

            if (data.success) {
                setPaymentHistory(data.data || []);
            }
        } catch (err) {
            setError('Gagal memuat riwayat');
        } finally {
            setLoadingHistory(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    const isOverdue = (dueDate: string) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-purple-500" /> Hutang / Piutang
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Kelola kredit pelanggan dan pembayaran
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm">Total Piutang</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(summary.totalUnpaid)}</p>
                            <p className="text-white/70 text-sm mt-1">{summary.count} transaksi</p>
                        </div>
                        <DollarSign size={32} className="opacity-50" />
                    </div>
                </div>

                <div className={`rounded-2xl p-6 text-white ${summary.overdueCount > 0 ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm">Jatuh Tempo</p>
                            <p className="text-2xl font-bold mt-1">{summary.overdueCount}</p>
                            <p className="text-white/70 text-sm mt-1">{summary.overdueCount > 0 ? 'Perlu tindakan!' : 'Semua aman'}</p>
                        </div>
                        {summary.overdueCount > 0 ? <AlertTriangle size={32} className="opacity-50" /> : <CheckCircle size={32} className="opacity-50" />}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Filter</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {[
                            { value: 'all', label: 'Semua' },
                            { value: 'unpaid', label: 'Belum Bayar' },
                            { value: 'partial', label: 'Cicilan' },
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === opt.value ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={showOverdue} onChange={(e) => setShowOverdue(e.target.checked)} className="rounded" />
                        Hanya jatuh tempo
                    </label>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Credits List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : credits.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">Tidak ada hutang yang perlu ditagih</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {credits.map((credit) => {
                            const remaining = credit.total - credit.paid_amount;
                            const overdue = isOverdue(credit.due_date);

                            return (
                                <div key={credit.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 ${overdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        {/* Customer Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                <span className="font-medium text-gray-900 dark:text-white">{credit.customer_name || 'Pelanggan Umum'}</span>
                                                {overdue && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">JATUH TEMPO</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                {credit.customer_phone && (
                                                    <span className="flex items-center gap-1"><Phone size={12} /> {credit.customer_phone}</span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(credit.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                                {credit.due_date && (
                                                    <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                                                        <Clock size={12} />
                                                        Jatuh tempo: {new Date(credit.due_date).toLocaleDateString('id-ID')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Amount Info */}
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Sisa hutang</p>
                                            <p className="text-xl font-bold text-red-600">{formatCurrency(remaining)}</p>
                                            <p className="text-xs text-gray-400">dari {formatCurrency(credit.total)}</p>
                                            {credit.paid_amount > 0 && (
                                                <p className="text-xs text-green-600">Dibayar: {formatCurrency(credit.paid_amount)}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => viewHistory(credit)}
                                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => openPaymentModal(credit)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                                            >
                                                <Plus size={16} />
                                                Bayar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedCredit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Catat Pembayaran</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                                <p className="text-sm text-gray-500">Pelanggan</p>
                                <p className="font-medium text-gray-900 dark:text-white">{selectedCredit.customer_name || 'Pelanggan Umum'}</p>
                                <div className="mt-2 flex justify-between text-sm">
                                    <span className="text-gray-500">Sisa hutang:</span>
                                    <span className="font-bold text-red-600">{formatCurrency(selectedCredit.total - selectedCredit.paid_amount)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Jumlah Bayar</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={selectedCredit.total - selectedCredit.paid_amount}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Metode Pembayaran</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="cash">Tunai</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="qris">QRIS</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Catatan</label>
                                <input
                                    type="text"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Catatan opsional"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                Batal
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={saving || !paymentAmount}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                            >
                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {saving ? 'Menyimpan...' : 'Simpan Pembayaran'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment History Modal */}
            {showHistoryModal && selectedCredit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Riwayat Pembayaran</h2>
                            <button onClick={() => setShowHistoryModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-96">
                            {loadingHistory ? (
                                <div className="flex items-center justify-center py-10">
                                    <Loader2 className="animate-spin text-gray-400" size={32} />
                                </div>
                            ) : paymentHistory.length === 0 ? (
                                <p className="text-center text-gray-500 py-10">Belum ada pembayaran</p>
                            ) : (
                                <div className="space-y-3">
                                    {paymentHistory.map((payment) => (
                                        <div key={payment.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {payment.payment_method === 'cash' ? 'Tunai' : payment.payment_method === 'transfer' ? 'Transfer' : 'QRIS'}
                                                    </p>
                                                </div>
                                                <p className="text-sm text-gray-400">
                                                    {new Date(payment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            {payment.notes && <p className="text-sm text-gray-500 mt-2">{payment.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
