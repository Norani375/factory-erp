import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'سیستم مدیریت کارخانه نجاری',
  description: 'سیستم ERP کارخانه نجاری و مبلمان',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-theme="neon-light">
      <body>{children}</body>
    </html>
  );
}
