// API Route: Test AI Connection
import { NextRequest, NextResponse } from 'next/server';
import { testAIConnection, AIProvider } from '@/lib/ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, apiKey, model } = body;

        if (!provider || !apiKey) {
            return NextResponse.json(
                { success: false, message: 'Provider dan API Key diperlukan' },
                { status: 400 }
            );
        }

        const result = await testAIConnection(provider as AIProvider, apiKey, model);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Terjadi kesalahan' },
            { status: 500 }
        );
    }
}
