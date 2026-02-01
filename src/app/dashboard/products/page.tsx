'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Package,
    AlertTriangle,
    Loader2,
    X,
    Save
} from 'lucide-react';

interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    price: number;
    cost: number;
    stock: number;
    min_stock: number;
    category_id: string;
    image_url: string;
    created_at: string;
}

export default function ProductsPage() {
    const { settings } = useSettingsStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        name: '',
        sku: '',
        description: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '5',
    });

    // Fetch products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (showLowStock) params.set('lowStock', 'true');

            const res = await fetch(`/api/products?${params}`);
            const data = await res.json();

            if (data.success) {
                setProducts(data.data || []);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal memuat produk');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [search, showLowStock]);

    // Open modal for new/edit
    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setForm({
                name: product.name,
                sku: product.sku || '',
                description: product.description || '',
                price: String(product.price || 0),
                cost: String(product.cost || 0),
                stock: String(product.stock || 0),
                minStock: String(product.min_stock || 5),
            });
        } else {
            setEditingProduct(null);
            setForm({ name: '', sku: '', description: '', price: '', cost: '', stock: '', minStock: '5' });
        }
        setShowModal(true);
    };

    // Save product
    const handleSave = async () => {
        if (!form.name) {
            setError('Nama produk diperlukan');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const method = editingProduct ? 'PUT' : 'POST';
            const body = {
                ...(editingProduct && { id: editingProduct.id }),
                name: form.name,
                sku: form.sku,
                description: form.description,
                price: parseFloat(form.price) || 0,
                cost: parseFloat(form.cost) || 0,
                stock: parseInt(form.stock) || 0,
                minStock: parseInt(form.minStock) || 5,
            };

            const res = await fetch('/api/products', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                setShowModal(false);
                fetchProducts();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal menyimpan produk');
        } finally {
            setSaving(false);
        }
    };

    // Delete product
    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus produk ini?')) return;

        try {
            const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                fetchProducts();
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal menghapus produk');
        }
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Package className="text-blue-500" /> Produk
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Kelola produk dan inventori
                    </p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all"
                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                >
                    <Plus size={20} />
                    Tambah Produk
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari produk..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={() => setShowLowStock(!showLowStock)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${showLowStock
                            ? 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400'
                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                        }`}
                >
                    <AlertTriangle size={20} />
                    Stok Rendah
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Products Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
                        <p className="text-gray-500 dark:text-gray-400">
                            {search || showLowStock ? 'Tidak ada produk yang cocok' : 'Belum ada produk. Klik "Tambah Produk" untuk mulai.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Produk</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SKU</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Harga</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stok</th>
                                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {products.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                                    <Package className="text-gray-400" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                                    {product.description && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{product.sku || '-'}</td>
                                        <td className="px-6 py-4 text-right text-gray-900 dark:text-white font-medium">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${product.stock <= product.min_stock
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                }`}>
                                                {product.stock <= product.min_stock && <AlertTriangle size={14} />}
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openModal(product)}
                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Produk *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Nama produk"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">SKU</label>
                                    <input
                                        type="text"
                                        value={form.sku}
                                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="SKU-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stok</label>
                                    <input
                                        type="number"
                                        value={form.stock}
                                        onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Harga Jual</label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Harga Modal</label>
                                    <input
                                        type="number"
                                        value={form.cost}
                                        onChange={(e) => setForm({ ...form, cost: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Deskripsi</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder="Deskripsi produk..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 dark:border-gray-700">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                            >
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
