'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
    const router = useRouter();
    const { setUser } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // For demo, accept any login
            // In production, this would call /api/auth/login
            if (formData.email && formData.password) {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Set demo user
                setUser({
                    id: '1',
                    email: formData.email,
                    name: formData.email.split('@')[0],
                    role: 'owner',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                });

                router.push('/dashboard');
            } else {
                setError('Email dan password diperlukan');
            }
        } catch (err) {
            setError('Gagal login. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">
                        ERP
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Selamat Datang
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Masuk ke dashboard ERP Anda
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="email@contoh.com"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>

                    {/* Demo Info */}
                    <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-sm">
                        <p className="text-blue-700 dark:text-blue-300 font-medium mb-1">
                            💡 Mode Demo
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                            Gunakan email dan password apapun untuk masuk ke demo dashboard.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                    ERP Template untuk UMKM Indonesia
                </p>
            </div>
        </div>
    );
}
