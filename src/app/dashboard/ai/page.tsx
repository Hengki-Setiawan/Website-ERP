'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { useSettingsStore } from '@/lib/store';
import { Send, Bot, User, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { AIMessage } from '@/types';

// Quick action buttons for the AI
const quickActions = [
    { label: '📊 Ringkasan Penjualan', prompt: 'Berikan ringkasan penjualan hari ini' },
    { label: '📦 Stok Rendah', prompt: 'Produk apa saja yang stoknya rendah?' },
    { label: '💰 Omset Bulan Ini', prompt: 'Berapa total omset bulan ini?' },
    { label: '👥 Pelanggan Top', prompt: 'Siapa 5 pelanggan terbaik bulan ini?' },
    { label: '📈 Analisis Trend', prompt: 'Analisis trend penjualan minggu ini' },
    { label: '💡 Rekomendasi', prompt: 'Berikan rekomendasi untuk meningkatkan penjualan' },
];

export default function AIAssistantPage() {
    const { settings } = useSettingsStore();
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send message to AI
    const sendMessage = async (content: string) => {
        if (!content.trim() || loading) return;

        // Check if AI is configured
        if (!settings.aiApiKey && settings.aiProvider !== 'ollama') {
            setMessages(prev => [...prev,
            { role: 'user', content },
            { role: 'assistant', content: '⚠️ AI belum dikonfigurasi. Silakan masukkan API Key di halaman **Pengaturan > AI**.' }
            ]);
            return;
        }

        const userMessage: AIMessage = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage],
                    config: {
                        provider: settings.aiProvider,
                        apiKey: settings.aiApiKey,
                        model: settings.aiModel,
                        systemPrompt: settings.aiSystemPrompt,
                        enabled: settings.aiEnabled,
                    },
                    // In production, this would include real business data context
                    context: `
Contoh Data Bisnis (Demo):
- Total Produk: 124
- Total Pelanggan: 89
- Penjualan Hari Ini: Rp 2.450.000 (15 transaksi)
- Omset Bulan Ini: Rp 45.670.000
- Produk Terlaris: Kaos Polos (56 terjual), Celana Jeans (34 terjual)
- Stok Rendah: Topi Baseball (stok 3), Sandal Kulit (stok 5)
          `.trim(),
                }),
            });

            const result = await response.json();

            if (result.success && result.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `❌ ${result.error || 'Gagal mendapatkan respons dari AI. Pastikan API Key valid.'}`
                }]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Terjadi kesalahan saat menghubungi AI. Silakan coba lagi.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-8rem)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bot className="text-blue-500" /> Asisten AI
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Tanyakan apa saja tentang bisnis Anda
                        </p>
                    </div>

                    <button
                        onClick={() => setMessages([])}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Reset Chat
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl mb-4"
                                    style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                                >
                                    <Sparkles />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Hai! Saya Asisten Bisnis AI
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                                    Saya bisa membantu menganalisis penjualan, stok, pelanggan, dan memberikan rekomendasi untuk bisnis Anda.
                                </p>

                                {/* Quick Actions */}
                                <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-2xl">
                                    {quickActions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => sendMessage(action.prompt)}
                                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {message.role === 'assistant' && (
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                                                style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                                            >
                                                <Bot size={18} />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[70%] px-4 py-3 rounded-2xl ${message.role === 'user'
                                                    ? 'bg-gradient-to-r text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                }`}
                                            style={message.role === 'user' ? {
                                                backgroundImage: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`
                                            } : undefined}
                                        >
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        </div>

                                        {message.role === 'user' && (
                                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                                <User size={18} className="text-gray-600 dark:text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-3 justify-start">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                                            style={{ background: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                                        >
                                            <Bot size={18} />
                                        </div>
                                        <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-700">
                                            <Loader2 className="animate-spin text-gray-500" size={20} />
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                        <form
                            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                            className="flex gap-3"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ketik pertanyaan tentang bisnis Anda..."
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r text-white font-medium disabled:opacity-50 transition-all"
                                style={{ backgroundImage: `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})` }}
                            >
                                <Send size={20} />
                            </button>
                        </form>

                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
                            AI: {settings.aiProvider?.toUpperCase() || 'Belum dikonfigurasi'} •
                            Model: {settings.aiModel || 'Default'}
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
