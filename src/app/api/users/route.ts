import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUser, hashPassword } from '@/lib/auth';
export const dynamic = 'force-dynamic';

export async function GET() {
  const current = await getUser();
  if (!current || current.role !== 'admin') return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
  const result = await db.execute('SELECT id, username, full_name, role, created_at FROM users');
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const current = await getUser();
  if (!current || current.role !== 'admin') return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
  try {
    const { username, password, fullName, role } = await request.json();
    if (!username || !password) return NextResponse.json({ error: 'نام کاربری و رمز عبور الزامی است' }, { status: 400 });
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [username] });
    if (existing.rows.length > 0) return NextResponse.json({ error: 'این نام کاربری قبلاً استفاده شده' }, { status: 400 });
    const hashed = hashPassword(password);
    await db.execute({ sql: 'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)', args: [username, hashed, fullName || username, role || 'user'] });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const current = await getUser();
  if (!current || current.role !== 'admin') return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'شناسه الزامی است' }, { status: 400 });
  if (Number(id) === current.userId) return NextResponse.json({ error: 'نمی‌توانید خودتان را حذف کنید' }, { status: 400 });
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [Number(id)] });
  return NextResponse.json({ ok: true });
}
