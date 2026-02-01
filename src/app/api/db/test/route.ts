// API Route: Test Database Connection
import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tursoUrl, tursoToken } = body;

        if (!tursoUrl || !tursoToken) {
            return NextResponse.json(
                { success: false, message: 'URL dan Token diperlukan' },
                { status: 400 }
            );
        }

        const result = await testConnection(tursoUrl, tursoToken);

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Terjadi kesalahan' },
            { status: 500 }
        );
    }
}
