'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    Phone,
    Mail,
    MapPin,
    Loader2,
    X,
    Save
} from 'lucide-react';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    created_at: string;
}

export default function CustomersPage() {
    const { settings } = useSettingsStore();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/customers?${params}`);
            const data = await res.json();

            if (data.success) {
                setCustomers(data.data || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal memuat pelanggan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [search]);

    const openModal = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer);
            setForm({
                name: customer.name,
                email: customer.email || '',
                phone: customer.phone || '',
                address: customer.address || '',
                notes: customer.notes || '',
            });
        } else {
            setEditingCustomer(null);
            setForm({ name: '', email: '', phone: '', address: '', notes: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name) {
            setError('Nama pelanggan diperlukan');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const method = editingCustomer ? 'PUT' : 'POST';
            const body = {
                ...(editingCustomer && { id: editingCustomer.id }),
                ...form,
            };

            const res = await fetch('/api/customers', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                fetchCustomers();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal menyimpan pelanggan');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;

        try {
            const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                fetchCustomers();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal menghapus pelanggan');
        }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-blue-500" /> Pelanggan
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Kelola data pelanggan
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                >
                    <Plus size={20} />
                    Tambah Pelanggan
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari pelanggan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Customers Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            ) : customers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center py-20">
                    <Users className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                    <p className="text-gray-500 dark:text-gray-400">
                        {search ? 'Tidak ada pelanggan yang cocok' : 'Belum ada pelanggan'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((customer) => (
                        <div key={customer.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{customer.name}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(customer.created_at).toLocaleDateString('id-ID')}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button onClick={() => openModal(customer)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(customer.id)} className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {customer.email && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Mail size={14} />
                                        <span>{customer.email}</span>
                                    </div>
                                )}
                                {customer.phone && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Phone size={14} />
                                        <span>{customer.phone}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <MapPin size={14} />
                                        <span className="truncate">{customer.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama *</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Nama pelanggan" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="email@contoh.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telepon</label>
                                    <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="08xx" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alamat</label>
                                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Alamat lengkap" />
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
