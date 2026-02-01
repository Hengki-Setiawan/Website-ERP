'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    Database,
    CheckCircle,
    XCircle,
    Loader2,
    Play,
    RefreshCw,
    Copy,
    ExternalLink,
    Package,
    Users,
    Receipt
} from 'lucide-react';

interface DbStats {
    products: number;
    customers: number;
    transactions: number;
}

export default function DatabaseSetupPage() {
    const { settings, updateSetting } = useSettingsStore();
    const [tursoUrl, setTursoUrl] = useState(settings.tursoUrl || '');
    const [tursoToken, setTursoToken] = useState(settings.tursoToken || '');
    const [testing, setTesting] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [status, setStatus] = useState<{ connected: boolean; stats?: DbStats; message?: string } | null>(null);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    // Check current status on mount
    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch('/api/db/init');
            const data = await res.json();
            if (data.success) {
                setStatus(data);
            }
        } catch (err) {
            setStatus({ connected: false, message: 'Gagal cek status' });
        }
    };

    const testConnection = async () => {
        if (!tursoUrl || !tursoToken) {
            setResult({ success: false, message: 'URL dan Token diperlukan' });
            return;
        }

        setTesting(true);
        setResult(null);

        try {
            const res = await fetch('/api/db/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tursoUrl, tursoToken }),
            });

            const data = await res.json();
            setResult(data);

            if (data.success) {
                updateSetting('tursoUrl', tursoUrl);
                updateSetting('tursoToken', tursoToken);
            }
        } catch (err) {
            setResult({ success: false, message: 'Gagal menghubungi server' });
        } finally {
            setTesting(false);
        }
    };

    const initializeDatabase = async () => {
        if (!tursoUrl || !tursoToken) {
            setResult({ success: false, message: 'URL dan Token diperlukan' });
            return;
        }

        setInitializing(true);
        setResult(null);

        try {
            const res = await fetch('/api/db/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tursoUrl, tursoToken, saveCredentials: true }),
            });

            const data = await res.json();
            setResult(data);

            if (data.success) {
                updateSetting('tursoUrl', tursoUrl);
                updateSetting('tursoToken', tursoToken);
                updateSetting('databaseMode', 'cloud');
                checkStatus();
            }
        } catch (err) {
            setResult({ success: false, message: 'Gagal inisialisasi database' });
        } finally {
            setInitializing(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Database className="text-blue-500" /> Setup Database
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Koneksikan ke database Turso untuk menyimpan data bisnis
                    </p>
                </div>

                {/* Current Status */}
                {status && (
                    <div className={`mb-6 p-6 rounded-2xl border ${status.connected
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        }`}>
                        <div className="flex items-center gap-3 mb-4">
                            {status.connected ? (
                                <CheckCircle className="text-green-500" size={24} />
                            ) : (
                                <XCircle className="text-yellow-500" size={24} />
                            )}
                            <div>
                                <h3 className={`font-semibold ${status.connected ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                                    {status.connected ? 'Database Terhubung' : 'Database Belum Terkonfigurasi'}
                                </h3>
                                <p className={`text-sm ${status.connected ? 'text-green-600 dark:text-green-500' : 'text-yellow-600 dark:text-yellow-500'}`}>
                                    {status.connected ? 'Koneksi aktif dan siap digunakan' : 'Silakan masukkan kredensial Turso'}
                                </p>
                            </div>
                        </div>

                        {status.connected && status.stats && (
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3">
                                    <Package className="text-blue-500" size={20} />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{status.stats.products}</p>
                                        <p className="text-xs text-gray-500">Produk</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3">
                                    <Users className="text-green-500" size={20} />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{status.stats.customers}</p>
                                        <p className="text-xs text-gray-500">Pelanggan</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-3">
                                    <Receipt className="text-purple-500" size={20} />
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{status.stats.transactions}</p>
                                        <p className="text-xs text-gray-500">Transaksi</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">📋 Cara Mendapatkan Database Turso (Gratis)</h3>
                    <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                        <li>1. Buka <a href="https://turso.tech" target="_blank" className="underline font-medium">turso.tech</a> dan daftar akun gratis</li>
                        <li>2. Buat database baru dengan nama apapun (misal: erp-database)</li>
                        <li>3. Klik database → <strong>Settings</strong> → Copy <strong>Database URL</strong></li>
                        <li>4. Klik <strong>Generate Token</strong> untuk mendapatkan Auth Token</li>
                        <li>5. Paste kedua nilai di form bawah ini</li>
                    </ol>
                    <a
                        href="https://turso.tech"
                        target="_blank"
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <ExternalLink size={16} />
                        Buka Turso.tech
                    </a>
                </div>

                {/* Configuration Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Kredensial Database</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Database URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={tursoUrl}
                                    onChange={(e) => setTursoUrl(e.target.value)}
                                    placeholder="libsql://your-database.turso.io"
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                />
                                <button
                                    onClick={() => copyToClipboard(tursoUrl)}
                                    className="px-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <Copy size={18} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Auth Token
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="password"
                                    value={tursoToken}
                                    onChange={(e) => setTursoToken(e.target.value)}
                                    placeholder="eyJhbGciOiJFZERTQSIsInR5cCI6..."
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                />
                            </div>
                        </div>

                        {/* Result Message */}
                        {result && (
                            <div className={`p-4 rounded-xl flex items-center gap-2 ${result.success
                                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                }`}>
                                {result.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                {result.message}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-4">
                            <button
                                onClick={testConnection}
                                disabled={testing || !tursoUrl || !tursoToken}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
                            >
                                {testing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                Test Koneksi
                            </button>

                            <button
                                onClick={initializeDatabase}
                                disabled={initializing || !tursoUrl || !tursoToken}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium disabled:opacity-50 transition-all"
                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                            >
                                {initializing ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                                {initializing ? 'Menginisialisasi...' : 'Inisialisasi Database'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* SQL Schema Preview */}
                <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📄 Tabel yang Akan Dibuat</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            'settings', 'users', 'products', 'categories',
                            'customers', 'suppliers', 'transactions', 'transaction_items',
                            'expenses', 'modules', 'tutorials', 'audit_logs', 'ai_config'
                        ].map((table) => (
                            <div key={table} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-mono text-gray-700 dark:text-gray-300">
                                {table}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
