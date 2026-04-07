# 🪵 سیستم مدیریت کارخانه نجاری (Factory ERP)

سیستم جامع مدیریت کارخانه نجاری و مبلمان - ساخته شده با Next.js و Turso

## امکانات
- 📊 داشبورد با نمودارها و آمار
- 📦 مدیریت محصولات نهایی (۳۱ قلم)
- 🔧 مدیریت مواد مصرفی (۳۴ قلم)
- 👥 مدیریت مشتریان (نقدی/نسیه)
- 🧾 فروش و فاکتور
- 💰 مدیریت بدهی‌ها و پرداخت‌ها
- 📋 فرمول ساخت (BOM)
- 📈 گزارشات پیشرفته

## راه‌اندازی

```bash
npm install
```

تنظیم دیتابیس Turso:
```bash
cp .env.local.example .env.local
# ویرایش .env.local با اطلاعات Turso
```

Seed دیتابیس:
```bash
npm run seed
```

اجرا:
```bash
npm run dev
```

## تکنولوژی‌ها
- Next.js 14 (App Router)
- Turso (SQLite Edge Database)
- Tailwind CSS + DaisyUI
- Lucide React Icons
