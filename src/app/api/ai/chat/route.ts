// API Route: AI Chat
import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI, DEFAULT_AI_SYSTEM_PROMPT } from '@/lib/ai';
import { AIMessage, AIConfig } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messages, config, context } = body as {
            messages: AIMessage[];
            config: AIConfig;
            context?: string;
        };

        if (!messages || !config) {
            return NextResponse.json(
                { success: false, message: 'Messages dan Config diperlukan' },
                { status: 400 }
            );
        }

        // Use default system prompt if not provided
        const aiConfig: AIConfig = {
            ...config,
            systemPrompt: config.systemPrompt || DEFAULT_AI_SYSTEM_PROMPT,
        };

        const result = await chatWithAI(aiConfig, messages, context);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Terjadi kesalahan' },
            { status: 500 }
        );
    }
}
