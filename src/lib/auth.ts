// Authentication utilities
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { User } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string, role: string): string {
    return jwt.sign(
        { userId, role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; role: string } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
        return decoded;
    } catch {
        return null;
    }
}

// Get current user from cookies
export async function getCurrentUser(): Promise<{ userId: string; role: string } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    return verifyToken(token);
}

// Set auth cookie
export async function setAuthCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

// Remove auth cookie
export async function removeAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
}

// Check if user has permission
export function hasPermission(userRole: string, requiredRole: string): boolean {
    const roleHierarchy: Record<string, number> = {
        owner: 4,
        admin: 3,
        cashier: 2,
        viewer: 1,
    };

    return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

// Role permissions matrix
export const PERMISSIONS = {
    dashboard: { view: ['owner', 'admin', 'cashier', 'viewer'] },
    products: {
        view: ['owner', 'admin', 'cashier', 'viewer'],
        create: ['owner', 'admin'],
        edit: ['owner', 'admin'],
        delete: ['owner', 'admin'],
    },
    pos: {
        view: ['owner', 'admin', 'cashier'],
        create: ['owner', 'admin', 'cashier'],
    },
    customers: {
        view: ['owner', 'admin', 'cashier', 'viewer'],
        create: ['owner', 'admin'],
        edit: ['owner', 'admin'],
        delete: ['owner', 'admin'],
    },
    suppliers: {
        view: ['owner', 'admin'],
        create: ['owner', 'admin'],
        edit: ['owner', 'admin'],
        delete: ['owner', 'admin'],
    },
    transactions: {
        view: ['owner', 'admin', 'cashier'],
        create: ['owner', 'admin', 'cashier'],
        edit: ['owner'],
        delete: ['owner'],
    },
    expenses: {
        view: ['owner', 'admin'],
        create: ['owner', 'admin'],
        edit: ['owner', 'admin'],
        delete: ['owner'],
    },
    reports: {
        view: ['owner', 'admin'],
    },
    settings: {
        view: ['owner', 'admin'],
        edit: ['owner'],
    },
    users: {
        view: ['owner'],
        create: ['owner'],
        edit: ['owner'],
        delete: ['owner'],
    },
} as const;
