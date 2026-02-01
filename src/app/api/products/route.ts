// API Route: Products CRUD Operations
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { cookies } from 'next/headers';

// Helper to get database client from stored credentials
async function getDbClient() {
    const cookieStore = await cookies();
    const tursoUrl = cookieStore.get('turso_url')?.value;
    const tursoToken = cookieStore.get('turso_token')?.value;

    if (!tursoUrl || !tursoToken) {
        return null;
    }

    return createClient({ url: tursoUrl, authToken: tursoToken });
}

// Generate UUID
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// GET - List all products or single product
export async function GET(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const lowStock = searchParams.get('lowStock');

        let sql = 'SELECT * FROM products';
        const conditions: string[] = [];
        const args: (string | number)[] = [];

        if (id) {
            sql += ' WHERE id = ?';
            args.push(id);
        } else {
            if (search) {
                conditions.push('(name LIKE ? OR sku LIKE ? OR description LIKE ?)');
                args.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (category) {
                conditions.push('category_id = ?');
                args.push(category);
            }
            if (lowStock === 'true') {
                conditions.push('stock <= min_stock');
            }

            if (conditions.length > 0) {
                sql += ' WHERE ' + conditions.join(' AND ');
            }
            sql += ' ORDER BY created_at DESC';
        }

        const result = await client.execute({ sql, args });

        if (id) {
            if (result.rows.length === 0) {
                return NextResponse.json({ success: false, message: 'Produk tidak ditemukan' }, { status: 404 });
            }
            return NextResponse.json({ success: true, data: result.rows[0] });
        }

        return NextResponse.json({ success: true, data: result.rows });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Gagal mengambil data' },
            { status: 500 }
        );
    }
}

// POST - Create new product
export async function POST(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const body = await request.json();
        const { name, sku, description, price, cost, stock, minStock, categoryId, imageUrl, customFields } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Nama produk diperlukan' }, { status: 400 });
        }

        const id = generateId();
        const now = new Date().toISOString();

        await client.execute({
            sql: `INSERT INTO products (id, name, sku, description, price, cost, stock, min_stock, category_id, image_url, custom_fields, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
                id,
                name,
                sku || null,
                description || null,
                price || 0,
                cost || 0,
                stock || 0,
                minStock || 5,
                categoryId || null,
                imageUrl || null,
                customFields ? JSON.stringify(customFields) : null,
                now,
                now
            ],
        });

        return NextResponse.json({
            success: true,
            message: 'Produk berhasil ditambahkan',
            data: { id }
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Gagal menambah produk' },
            { status: 500 }
        );
    }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const body = await request.json();
        const { id, name, sku, description, price, cost, stock, minStock, categoryId, imageUrl, customFields } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID produk diperlukan' }, { status: 400 });
        }

        const now = new Date().toISOString();

        await client.execute({
            sql: `UPDATE products SET 
            name = COALESCE(?, name),
            sku = COALESCE(?, sku),
            description = COALESCE(?, description),
            price = COALESCE(?, price),
            cost = COALESCE(?, cost),
            stock = COALESCE(?, stock),
            min_stock = COALESCE(?, min_stock),
            category_id = COALESCE(?, category_id),
            image_url = COALESCE(?, image_url),
            custom_fields = COALESCE(?, custom_fields),
            updated_at = ?
            WHERE id = ?`,
            args: [
                name || null,
                sku || null,
                description || null,
                price ?? null,
                cost ?? null,
                stock ?? null,
                minStock ?? null,
                categoryId || null,
                imageUrl || null,
                customFields ? JSON.stringify(customFields) : null,
                now,
                id
            ],
        });

        return NextResponse.json({
            success: true,
            message: 'Produk berhasil diperbarui'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Gagal memperbarui produk' },
            { status: 500 }
        );
    }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
    try {
        const client = await getDbClient();
        if (!client) {
            return NextResponse.json({ success: false, message: 'Database tidak terkonfigurasi' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID produk diperlukan' }, { status: 400 });
        }

        await client.execute({
            sql: 'DELETE FROM products WHERE id = ?',
            args: [id],
        });

        return NextResponse.json({
            success: true,
            message: 'Produk berhasil dihapus'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Gagal menghapus produk' },
            { status: 500 }
        );
    }
}
