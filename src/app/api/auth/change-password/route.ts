import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { currentPassword, newPassword } = await req.json();
  const sessionToken = cookies().get('session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'لطفاً دوباره وارد شوید' }, { status: 401 });

  const session = await db.execute({ sql: "SELECT user_id FROM sessions WHERE token=? AND expires_at > datetime('now')", args: [sessionToken] });
  if (!session.rows.length) return NextResponse.json({ error: 'نشست منقضی شده' }, { status: 401 });

  const userId = session.rows[0].user_id;
  const user = await db.execute({ sql: 'SELECT password_hash FROM users WHERE id=?', args: [userId] });
  if (!user.rows.length) return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });

  if (user.rows[0].password_hash !== currentPassword) {
    return NextResponse.json({ error: 'رمز فعلی اشتباه است' }, { status: 400 });
  }

  await db.execute({ sql: 'UPDATE users SET password_hash=? WHERE id=?', args: [newPassword, userId] });
  return NextResponse.json({ success: true });
}
