// API Route: Authentication
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function getDbClient() {
    const cookieStore = await cookies();
    const tursoUrl = cookieStore.get('turso_url')?.value;
    const tursoToken = cookieStore.get('turso_token')?.value;
    if (!tursoUrl || !tursoToken) return null;
    return createClient({ url: tursoUrl, authToken: tursoToken });
}

function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// POST - Login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, email, password, name, role } = body;

        const client = await getDbClient();

        // Demo login mode (when no database configured)
        if (!client) {
            if (action === 'login') {
                // Allow demo login with any credentials
                const token = jwt.sign(
                    { userId: 'demo-user', email, role: 'owner' },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                const cookieStore = await cookies();
                cookieStore.set('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    path: '/',
                });

                return NextResponse.json({
                    success: true,
                    message: 'Login berhasil (mode demo)',
                    user: {
                        id: 'demo-user',
                        email,
                        name: email.split('@')[0],
                        role: 'owner',
                    }
                });
            }
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        if (action === 'login') {
            // Find user by email
            const result = await client.execute({
                sql: 'SELECT * FROM users WHERE email = ?',
                args: [email]
            });

            if (result.rows.length === 0) {
                return NextResponse.json({ success: false, message: 'Email atau password salah' }, { status: 401 });
            }

            const user = result.rows[0];
            const validPassword = await bcrypt.compare(password, user.password_hash as string);

            if (!validPassword) {
                return NextResponse.json({ success: false, message: 'Email atau password salah' }, { status: 401 });
            }

            // Generate JWT
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Set cookie
            const cookieStore = await cookies();
            cookieStore.set('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
            });

            return NextResponse.json({
                success: true,
                message: 'Login berhasil',
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            });
        }

        if (action === 'register') {
            // Check if user exists
            const existing = await client.execute({
                sql: 'SELECT id FROM users WHERE email = ?',
                args: [email]
            });

            if (existing.rows.length > 0) {
                return NextResponse.json({ success: false, message: 'Email sudah terdaftar' }, { status: 400 });
            }

            // Hash password and create user
            const passwordHash = await bcrypt.hash(password, 12);
            const userId = generateId();
            const now = new Date().toISOString();

            await client.execute({
                sql: `INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                args: [userId, email, passwordHash, name || email.split('@')[0], role || 'viewer', now, now]
            });

            return NextResponse.json({
                success: true,
                message: 'Registrasi berhasil',
                data: { id: userId }
            });
        }

        if (action === 'logout') {
            const cookieStore = await cookies();
            cookieStore.delete('auth_token');
            return NextResponse.json({ success: true, message: 'Logout berhasil' });
        }

        return NextResponse.json({ success: false, message: 'Action tidak valid' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error instanceof Error ? error.message : 'Gagal autentikasi'
        }, { status: 500 });
    }
}

// GET - Check current auth status
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ success: true, authenticated: false });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
            return NextResponse.json({
                success: true,
                authenticated: true,
                user: {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                }
            });
        } catch {
            return NextResponse.json({ success: true, authenticated: false });
        }
    } catch (error) {
        return NextResponse.json({ success: false, authenticated: false }, { status: 500 });
    }
}
