'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    ShoppingCart,
    Plus,
    Minus,
    Trash2,
    Search,
    CreditCard,
    Banknote,
    QrCode,
    CheckCircle,
    Loader2,
    Package,
    User,
    Clock,
    Printer,
    Calendar
} from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    sku: string;
}

interface CartItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
}

interface Customer {
    id: string;
    name: string;
}

export default function POSPage() {
    const { settings } = useSettingsStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'qris' | 'credit'>('cash');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastTransaction, setLastTransaction] = useState<{ id: string; total: number } | null>(null);
    const [error, setError] = useState('');

    // Credit payment options
    const [dueDate, setDueDate] = useState('');
    const [downPayment, setDownPayment] = useState('');

    // Receipt modal
    const [showReceipt, setShowReceipt] = useState(false);

    const searchRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                searchRef.current?.focus();
            } else if (e.key === 'F2' && cart.length > 0) {
                e.preventDefault();
                processTransaction();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setCart([]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart]);

    // Fetch products and customers
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, customersRes] = await Promise.all([
                    fetch('/api/products'),
                    fetch('/api/customers'),
                ]);

                const productsData = await productsRes.json();
                const customersData = await customersRes.json();

                if (productsData.success) setProducts(productsData.data || []);
                if (customersData.success) setCustomers(customersData.data || []);
            } catch (err) {
                setError('Gagal memuat data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Set default due date to 7 days from now
        const defaultDue = new Date();
        defaultDue.setDate(defaultDue.getDate() + 7);
        setDueDate(defaultDue.toISOString().split('T')[0]);
    }, []);

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    // Add to cart
    const addToCart = (product: Product) => {
        if (product.stock <= 0) {
            setError('Stok habis!');
            setTimeout(() => setError(''), 2000);
            return;
        }

        const existing = cart.find(item => item.productId === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) {
                setError('Stok tidak cukup!');
                setTimeout(() => setError(''), 2000);
                return;
            }
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: 1,
            }]);
        }
    };

    // Update quantity
    const updateQuantity = (productId: string, delta: number) => {
        const product = products.find(p => p.id === productId);
        setCart(cart.map(item => {
            if (item.productId !== productId) return item;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return item;
            if (product && newQty > product.stock) return item;
            return { ...item, quantity: newQty };
        }));
    };

    // Remove from cart
    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.11); // PPN 11%
    const total = subtotal + tax;

    // Process transaction
    const processTransaction = async () => {
        if (cart.length === 0) {
            setError('Keranjang kosong!');
            return;
        }

        if (paymentMethod === 'credit' && !selectedCustomer) {
            setError('Pilih pelanggan untuk pembayaran kredit!');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const payload: Record<string, unknown> = {
                type: 'sale',
                customerId: selectedCustomer || null,
                items: cart,
                tax,
                paymentMethod: paymentMethod === 'credit' ? 'cash' : paymentMethod,
            };

            // Handle credit payment
            if (paymentMethod === 'credit') {
                payload.paymentStatus = downPayment && parseFloat(downPayment) > 0 ? 'partial' : 'unpaid';
                payload.paidAmount = downPayment ? parseFloat(downPayment) : 0;
                payload.dueDate = dueDate;
            } else {
                payload.paymentStatus = 'paid';
            }

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.success) {
                setLastTransaction({ id: data.data.id, total: data.data.total });
                setShowSuccess(true);
                setShowReceipt(true);
                setCart([]);
                setSelectedCustomer('');
                setDownPayment('');

                // Refresh products to get updated stock
                const productsRes = await fetch('/api/products');
                const productsData = await productsRes.json();
                if (productsData.success) setProducts(productsData.data || []);

                setTimeout(() => setShowSuccess(false), 3000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError('Gagal memproses transaksi');
        } finally {
            setProcessing(false);
        }
    };

    // Print receipt
    const printReceipt = () => {
        window.print();
    };

    // Format currency
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <DashboardLayout>
            {/* Keyboard shortcuts hint */}
            <div className="mb-4 flex gap-4 text-xs text-gray-500">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">F1: Cari</span>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">F2: Bayar</span>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Esc: Clear</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
                {/* Products Section */}
                <div className="flex-1 flex flex-col">
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Cari produk... (F1)"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        </div>
                    ) : (
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pb-4">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    disabled={product.stock <= 0}
                                    className={`p-4 rounded-xl border text-left transition-all ${product.stock <= 0
                                        ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                                        <Package className="text-gray-400" size={20} />
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">{product.name}</h3>
                                    <p className="text-blue-600 dark:text-blue-400 font-bold mt-1">{formatCurrency(product.price)}</p>
                                    <p className={`text-xs mt-1 ${product.stock <= 5 ? 'text-red-500' : 'text-gray-500'}`}>
                                        Stok: {product.stock}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Section */}
                <div className="lg:w-96 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart size={20} />
                            Keranjang
                        </h2>
                    </div>

                    {/* Customer Select */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <User size={18} className="text-gray-400" />
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            >
                                <option value="">Pelanggan Umum</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <ShoppingCart className="mx-auto mb-2" size={32} />
                                <p>Keranjang kosong</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.productId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">{item.productName}</p>
                                        <p className="text-sm text-blue-600">{formatCurrency(item.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.productId, -1)}
                                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.productId, 1)}
                                            className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="w-8 h-8 rounded-lg text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Payment Section */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                        {/* Totals */}
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">PPN (11%)</span>
                                <span className="text-gray-900 dark:text-white">{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-gray-900 dark:text-white">Total</span>
                                <span style={{ color: settings.primaryColor }}>{formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'cash', icon: Banknote, label: 'Tunai' },
                                { id: 'card', icon: CreditCard, label: 'Kartu' },
                                { id: 'qris', icon: QrCode, label: 'QRIS' },
                                { id: 'credit', icon: Clock, label: 'Kredit' },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id as 'cash' | 'card' | 'qris' | 'credit')}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${paymentMethod === method.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600'
                                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <method.icon size={18} />
                                    <span className="text-[10px] font-medium">{method.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Credit Options */}
                        {paymentMethod === 'credit' && (
                            <div className="space-y-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        <Calendar size={12} className="inline mr-1" />
                                        Jatuh Tempo
                                    </label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        DP (Opsional)
                                    </label>
                                    <input
                                        type="number"
                                        value={downPayment}
                                        onChange={(e) => setDownPayment(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {/* Success */}
                        {showSuccess && (
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 text-sm text-center flex items-center justify-center gap-2">
                                <CheckCircle size={18} />
                                {paymentMethod === 'credit' ? 'Transaksi kredit berhasil!' : 'Transaksi berhasil!'}
                            </div>
                        )}

                        {/* Pay Button */}
                        <button
                            onClick={processTransaction}
                            disabled={cart.length === 0 || processing}
                            className="w-full py-4 rounded-xl text-white font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                            style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={20} />
                                    {paymentMethod === 'credit' ? 'Simpan Kredit' : `Bayar ${formatCurrency(total)}`}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && lastTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:p-0 print:bg-white">
                    <div className="bg-white rounded-2xl w-full max-w-sm print:max-w-none print:rounded-none print:shadow-none">
                        {/* Receipt Content */}
                        <div className="p-6 print:p-4" id="receipt">
                            <div className="text-center mb-4">
                                <h2 className="text-xl font-bold">{settings.businessName || 'Toko UMKM'}</h2>
                                <p className="text-sm text-gray-500">{settings.businessAddress || ''}</p>
                                <p className="text-sm text-gray-500">{settings.businessPhone || ''}</p>
                            </div>

                            <div className="border-t border-b border-dashed border-gray-300 py-3 my-3">
                                <p className="text-xs text-gray-500">No: {lastTransaction.id.slice(0, 8).toUpperCase()}</p>
                                <p className="text-xs text-gray-500">{new Date().toLocaleString('id-ID')}</p>
                            </div>

                            <div className="text-center py-4">
                                <p className="text-2xl font-bold">{formatCurrency(lastTransaction.total)}</p>
                                <p className="text-sm text-green-600 mt-1">
                                    {paymentMethod === 'credit' ? '✓ KREDIT' : '✓ LUNAS'}
                                </p>
                            </div>

                            <div className="border-t border-dashed border-gray-300 pt-3 text-center">
                                <p className="text-xs text-gray-500">Terima kasih atas kunjungan Anda</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 p-4 border-t print:hidden">
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700"
                            >
                                Tutup
                            </button>
                            <button
                                onClick={printReceipt}
                                className="flex-1 py-2 rounded-lg text-white flex items-center justify-center gap-2"
                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                            >
                                <Printer size={18} />
                                Cetak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
