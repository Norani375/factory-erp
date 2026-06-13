'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  Wrench,
  ClipboardList,
  Users,
  ShoppingCart,
  CreditCard,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';

export type Page =
  | 'dashboard'
  | 'products'
  | 'materials'
  | 'bom'
  | 'customers'
  | 'sales'
  | 'debts'
  | 'expenses'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems: { page: Page; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { page: 'products', label: 'محصولات نهایی', icon: Package },
  { page: 'materials', label: 'مواد مصرفی', icon: Wrench },
  { page: 'bom', label: 'فرمول ساخت (BOM)', icon: ClipboardList },
  { page: 'customers', label: 'مشتریان', icon: Users },
  { page: 'sales', label: 'فروش و فاکتور', icon: ShoppingCart },
  { page: 'debts', label: 'بدهی‌ها', icon: CreditCard },
  { page: 'expenses', label: 'مصارف', icon: Wallet },
  { page: 'reports', label: 'گزارشات', icon: BarChart3 },
  { page: 'settings', label: 'تنظیمات', icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  const handleNav = (page: Page) => {
    onNavigate(page);
    // Close drawer on mobile after navigation
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile floating menu button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-3 right-3 z-[60] btn btn-circle btn-primary shadow-lg no-print"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Backdrop for mobile drawer */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-[70] no-print"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full bg-base-200 z-[80] transition-all duration-300 no-print
          md:sticky md:top-0 md:z-10
          ${collapsed ? 'w-0 md:w-16 overflow-hidden' : 'w-64 md:w-56'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          {!collapsed && (
            <h2 className="text-sm font-bold whitespace-nowrap">🏭 سیستم مدیریت کارخانه</h2>
          )}
          <button onClick={onToggle} className="btn btn-ghost btn-sm btn-circle">
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </button>
        </div>

        {/* Menu */}
        <ul className="menu menu-sm gap-1 p-2">
          {menuItems.map(({ page, label, icon: Icon }) => (
            <li key={page}>
              <button
                onClick={() => handleNav(page)}
                className={`flex items-center gap-3 rounded-lg ${
                  currentPage === page ? 'active bg-primary text-primary-content' : ''
                }`}
                title={label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
