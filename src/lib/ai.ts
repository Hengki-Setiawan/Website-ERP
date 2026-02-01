// AI Integration - Multi-provider support
import { AIMessage, AIConfig } from '@/types';

// AI Provider configurations
const AI_PROVIDERS = {
    groq: {
        baseUrl: 'https://api.groq.com/openai/v1',
        defaultModel: 'llama-3.3-70b-versatile',
        models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    },
    openai: {
        baseUrl: 'https://api.openai.com/v1',
        defaultModel: 'gpt-4o-mini',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    },
    gemini: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        defaultModel: 'gemini-1.5-flash',
        models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    },
    anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        defaultModel: 'claude-3-haiku-20240307',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    },
    ollama: {
        baseUrl: 'http://localhost:11434/api',
        defaultModel: 'llama3.2',
        models: ['llama3.2', 'mistral', 'qwen2.5'],
    },
};

export type AIProvider = keyof typeof AI_PROVIDERS;

// Get provider config
export function getProviderConfig(provider: AIProvider) {
    return AI_PROVIDERS[provider];
}

// Test AI API key
export async function testAIConnection(
    provider: AIProvider,
    apiKey: string,
    model?: string
): Promise<{ success: boolean; message: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
        const config = AI_PROVIDERS[provider];
        const testModel = model || config.defaultModel;

        if (provider === 'gemini') {
            // Gemini uses different API structure
            const response = await fetch(
                `${config.baseUrl}/models/${testModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Hi' }] }],
                        generationConfig: { maxOutputTokens: 10 },
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Invalid API Key');
            }
        } else if (provider === 'anthropic') {
            const response = await fetch(`${config.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: testModel,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Invalid API Key');
            }
        } else if (provider === 'ollama') {
            const response = await fetch(`${config.baseUrl}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: testModel,
                    prompt: 'Hi',
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error('Ollama not running or model not found');
            }
        } else {
            // OpenAI-compatible API (Groq, OpenAI)
            const response = await fetch(`${config.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: testModel,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 10,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Invalid API Key');
            }
        }

        const responseTime = Date.now() - startTime;
        return {
            success: true,
            message: `API Key valid! Model: ${testModel}`,
            responseTime,
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Gagal terhubung ke AI',
        };
    }
}

// Chat with AI
export async function chatWithAI(
    config: AIConfig,
    messages: AIMessage[],
    context?: string
): Promise<{ success: boolean; content?: string; error?: string }> {
    try {
        const providerConfig = AI_PROVIDERS[config.provider as AIProvider];
        if (!providerConfig) {
            throw new Error(`Provider ${config.provider} tidak didukung`);
        }

        // Build system prompt with context
        const systemPrompt = context
            ? `${config.systemPrompt}\n\n## Data Bisnis Terkini:\n${context}`
            : config.systemPrompt;

        const allMessages: AIMessage[] = [
            { role: 'system', content: systemPrompt },
            ...messages,
        ];

        if (config.provider === 'gemini') {
            return await chatWithGemini(config.apiKey, config.model, allMessages);
        } else if (config.provider === 'anthropic') {
            return await chatWithAnthropic(config.apiKey, config.model, allMessages);
        } else if (config.provider === 'ollama') {
            return await chatWithOllama(config.model, allMessages);
        } else {
            return await chatWithOpenAICompatible(providerConfig.baseUrl, config.apiKey, config.model, allMessages);
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Gagal berkomunikasi dengan AI',
        };
    }
}

// OpenAI-compatible chat (Groq, OpenAI)
async function chatWithOpenAICompatible(
    baseUrl: string,
    apiKey: string,
    model: string,
    messages: AIMessage[]
): Promise<{ success: boolean; content?: string; error?: string }> {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return {
        success: true,
        content: data.choices[0]?.message?.content || '',
    };
}

// Gemini chat
async function chatWithGemini(
    apiKey: string,
    model: string,
    messages: AIMessage[]
): Promise<{ success: boolean; content?: string; error?: string }> {
    const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                generationConfig: { temperature: 0.7 },
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return {
        success: true,
        content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
    };
}

// Anthropic chat
async function chatWithAnthropic(
    apiKey: string,
    model: string,
    messages: AIMessage[]
): Promise<{ success: boolean; content?: string; error?: string }> {
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: systemMessage,
            messages: chatMessages,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return {
        success: true,
        content: data.content?.[0]?.text || '',
    };
}

// Ollama chat (local)
async function chatWithOllama(
    model: string,
    messages: AIMessage[]
): Promise<{ success: boolean; content?: string; error?: string }> {
    const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: false,
        }),
    });

    if (!response.ok) {
        throw new Error('Ollama request failed');
    }

    const data = await response.json();
    return {
        success: true,
        content: data.message?.content || '',
    };
}

// Default system prompt for business AI
export const DEFAULT_AI_SYSTEM_PROMPT = `Kamu adalah Asisten Bisnis AI yang cerdas dan ramah untuk membantu pemilik UMKM.

## Kemampuan:
- Menjawab pertanyaan tentang penjualan, stok, dan pelanggan
- Memberikan analisis dan insight bisnis
- Membantu kalkulasi profit, margin, dan proyeksi
- Memberikan rekomendasi untuk meningkatkan bisnis

## Panduan:
- Jawab dalam Bahasa Indonesia yang jelas dan ramah
- Gunakan emoji untuk membuat respons lebih menarik
- Berikan data dan angka spesifik jika tersedia
- Berikan rekomendasi yang actionable

## Format Respons:
- Gunakan bullet points untuk list
- Gunakan bold untuk angka penting
- Berikan ringkasan di akhir jika jawaban panjang`;

export { AI_PROVIDERS };
