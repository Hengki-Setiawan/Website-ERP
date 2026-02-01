'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import {
    Database,
    Bot,
    Palette,
    Building2,
    Save,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { AI_PROVIDERS } from '@/lib/ai';

type SettingsTab = 'business' | 'database' | 'ai' | 'theme';

export default function SettingsPage() {
    const { settings, updateSetting } = useSettingsStore();
    const [activeTab, setActiveTab] = useState<SettingsTab>('business');
    const [saving, setSaving] = useState(false);
    const [testingDb, setTestingDb] = useState(false);
    const [testingAi, setTestingAi] = useState(false);
    const [dbStatus, setDbStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [aiStatus, setAiStatus] = useState<{ success: boolean; message: string; responseTime?: number } | null>(null);

    const tabs = [
        { id: 'business' as const, label: 'Bisnis', icon: Building2 },
        { id: 'database' as const, label: 'Database', icon: Database },
        { id: 'ai' as const, label: 'AI', icon: Bot },
        { id: 'theme' as const, label: 'Tema', icon: Palette },
    ];

    // Test database connection
    const testDatabaseConnection = async () => {
        setTestingDb(true);
        setDbStatus(null);

        try {
            const response = await fetch('/api/db/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tursoUrl: settings.tursoUrl,
                    tursoToken: settings.tursoToken,
                }),
            });

            const result = await response.json();
            setDbStatus(result);
        } catch (error) {
            setDbStatus({ success: false, message: 'Gagal menghubungi server' });
        } finally {
            setTestingDb(false);
        }
    };

    // Test AI connection
    const testAIConnection = async () => {
        setTestingAi(true);
        setAiStatus(null);

        try {
            const response = await fetch('/api/ai/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: settings.aiProvider,
                    apiKey: settings.aiApiKey,
                    model: settings.aiModel,
                }),
            });

            const result = await response.json();
            setAiStatus(result);
        } catch (error) {
            setAiStatus({ success: false, message: 'Gagal menghubungi server' });
        } finally {
            setTestingAi(false);
        }
    };

    // Save all settings
    const handleSave = async () => {
        setSaving(true);
        // In production, this would save to database
        await new Promise(resolve => setTimeout(resolve, 500));
        setSaving(false);
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Pengaturan
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Konfigurasi database, AI, dan tampilan
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tabs */}
                <div className="lg:w-64 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 border border-gray-100 dark:border-gray-700">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">

                    {/* Business Settings */}
                    {activeTab === 'business' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Informasi Bisnis
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nama Bisnis
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.businessName || ''}
                                        onChange={(e) => updateSetting('businessName', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Toko UMKM"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Email Bisnis
                                    </label>
                                    <input
                                        type="email"
                                        value={settings.businessEmail || ''}
                                        onChange={(e) => updateSetting('businessEmail', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="email@bisnis.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Telepon
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.businessPhone || ''}
                                        onChange={(e) => updateSetting('businessPhone', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="+62 812 3456 7890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Mata Uang
                                    </label>
                                    <select
                                        value={settings.currency || 'IDR'}
                                        onChange={(e) => updateSetting('currency', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="IDR">IDR - Rupiah Indonesia</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Alamat
                                </label>
                                <textarea
                                    value={settings.businessAddress || ''}
                                    onChange={(e) => updateSetting('businessAddress', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Alamat lengkap bisnis"
                                />
                            </div>
                        </div>
                    )}

                    {/* Database Settings */}
                    {activeTab === 'database' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Konfigurasi Database
                            </h2>

                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                <p className="text-sm">
                                    💡 Dapatkan database Turso gratis di{' '}
                                    <a href="https://turso.tech" target="_blank" className="underline font-medium">turso.tech</a>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Mode Database
                                </label>
                                <select
                                    value={settings.databaseMode || 'local'}
                                    onChange={(e) => updateSetting('databaseMode', e.target.value as 'cloud' | 'local' | 'hybrid')}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="local">🏠 Local (Browser)</option>
                                    <option value="cloud">☁️ Cloud (Turso)</option>
                                    <option value="hybrid">🔄 Hybrid (Local + Sync)</option>
                                </select>
                            </div>

                            {(settings.databaseMode === 'cloud' || settings.databaseMode === 'hybrid') && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Turso Database URL
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.tursoUrl || ''}
                                            onChange={(e) => updateSetting('tursoUrl', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                            placeholder="libsql://your-database.turso.io"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Turso Auth Token
                                        </label>
                                        <input
                                            type="password"
                                            value={settings.tursoToken || ''}
                                            onChange={(e) => updateSetting('tursoToken', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                            placeholder="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
                                        />
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={testDatabaseConnection}
                                            disabled={testingDb || !settings.tursoUrl || !settings.tursoToken}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                                        >
                                            {testingDb ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                            Test Koneksi
                                        </button>

                                        {dbStatus && (
                                            <div className={`flex items-center gap-2 text-sm ${dbStatus.success ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {dbStatus.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                {dbStatus.message}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* AI Settings */}
                    {activeTab === 'ai' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Konfigurasi AI
                            </h2>

                            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                <p className="text-sm">
                                    🤖 AI membantu menjawab pertanyaan bisnis, analisis data, dan memberikan rekomendasi.
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Aktifkan AI
                                </label>
                                <button
                                    onClick={() => updateSetting('aiEnabled', !settings.aiEnabled)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.aiEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.aiEnabled ? 'translate-x-8' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            {settings.aiEnabled && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            AI Provider
                                        </label>
                                        <select
                                            value={settings.aiProvider || 'groq'}
                                            onChange={(e) => {
                                                const provider = e.target.value as keyof typeof AI_PROVIDERS;
                                                updateSetting('aiProvider', provider);
                                                updateSetting('aiModel', AI_PROVIDERS[provider]?.defaultModel || '');
                                            }}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="groq">⚡ Groq (Tercepat, Gratis)</option>
                                            <option value="openai">🧠 OpenAI</option>
                                            <option value="gemini">✨ Google Gemini</option>
                                            <option value="anthropic">🎯 Anthropic Claude</option>
                                            <option value="ollama">🏠 Ollama (Lokal)</option>
                                        </select>
                                    </div>

                                    {settings.aiProvider !== 'ollama' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                API Key
                                            </label>
                                            <input
                                                type="password"
                                                value={settings.aiApiKey || ''}
                                                onChange={(e) => updateSetting('aiApiKey', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                                placeholder={settings.aiProvider === 'groq' ? 'gsk_...' : 'sk-...'}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Model
                                        </label>
                                        <select
                                            value={settings.aiModel || ''}
                                            onChange={(e) => updateSetting('aiModel', e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            {(AI_PROVIDERS[settings.aiProvider as keyof typeof AI_PROVIDERS]?.models || []).map((model) => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={testAIConnection}
                                            disabled={testingAi || (!settings.aiApiKey && settings.aiProvider !== 'ollama')}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all"
                                        >
                                            {testingAi ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                                            Test API Key
                                        </button>

                                        {aiStatus && (
                                            <div className={`flex items-center gap-2 text-sm ${aiStatus.success ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {aiStatus.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                                {aiStatus.message}
                                                {aiStatus.responseTime && ` (${aiStatus.responseTime}ms)`}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Theme Settings */}
                    {activeTab === 'theme' && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Kustomisasi Tampilan
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Warna Primer
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={settings.primaryColor || '#3b82f6'}
                                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                            className="w-12 h-12 rounded-xl cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.primaryColor || '#3b82f6'}
                                            onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Warna Sekunder
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={settings.secondaryColor || '#10b981'}
                                            onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                                            className="w-12 h-12 rounded-xl cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.secondaryColor || '#10b981'}
                                            onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Warna Aksen
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={settings.accentColor || '#f59e0b'}
                                            onChange={(e) => updateSetting('accentColor', e.target.value)}
                                            className="w-12 h-12 rounded-xl cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={settings.accentColor || '#f59e0b'}
                                            onChange={(e) => updateSetting('accentColor', e.target.value)}
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Preview
                                </label>
                                <div
                                    className="p-6 rounded-xl text-white"
                                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                                >
                                    <p className="font-bold text-lg">{settings.businessName || 'Toko UMKM'}</p>
                                    <p className="opacity-90 mt-1">Ini adalah preview tampilan dengan warna yang dipilih</p>
                                    <button
                                        className="mt-4 px-4 py-2 rounded-lg font-medium"
                                        style={{ backgroundColor: settings.accentColor }}
                                    >
                                        Tombol Aksen
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mode Gelap
                                </label>
                                <button
                                    onClick={() => updateSetting('darkMode', !settings.darkMode)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.darkMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.darkMode ? 'translate-x-8' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
