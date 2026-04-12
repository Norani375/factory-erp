"use client";
import React from 'react';
import {
  LayoutDashboard, Package, Wrench, Users, ShoppingCart,
  CreditCard, BarChart3, ClipboardList, ChevronLeft, ChevronRight, LogOut, UserCircle
} from 'lucide-react';
import { Page } from '@/app/page';

interface UserInfo {
  userId: number;
  username: string;
  role: string;
}

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
  user?: UserInfo | null;
  onLogout?: () => void;
}

const menuItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard size={20} /> },
  { page: 'products', label: 'محصولات نهایی', icon: <Package size={20} /> },
  { page: 'materials', label: 'مواد مصرفی', icon: <Wrench size={20} /> },
  { page: 'bom', label: 'فرمول ساخت (BOM)', icon: <ClipboardList size={20} /> },
  { page: 'customers', label: 'مشتریان', icon: <Users size={20} /> },
  { page: 'sales', label: 'فروش و فاکتور', icon: <ShoppingCart size={20} /> },
  { page: 'debts', label: 'بدهی‌ها', icon: <CreditCard size={20} /> },
  { page: 'reports', label: 'گزارشات', icon: <BarChart3 size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle, user, onLogout }: SidebarProps) {
  return (
    <div className={`bg-white h-full flex flex-col transition-all duration-300 border-l border-base-300 shadow-lg ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-base-300 bg-gradient-to-l from-sky-50 to-white">
        {!collapsed && (
          <span className="font-bold text-sm bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">
            🪵 نجاری ERP
          </span>
        )}
        <button className="btn btn-ghost btn-xs" onClick={onToggle}>
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* Menu */}
      <ul className="menu gap-1 p-2 flex-1">
        {menuItems.map((item) => (
          <li key={item.page}>
            <a
              className={`flex items-center gap-3 rounded-lg transition-all ${
                currentPage === item.page 
                  ? 'bg-gradient-to-l from-sky-100 to-violet-50 text-primary font-semibold shadow-sm' 
                  : 'hover:bg-sky-50 text-base-content/70 hover:text-primary'
              }`}
              onClick={() => onNavigate(item.page)}
            >
              {item.icon}
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </a>
          </li>
        ))}
      </ul>

      {/* User & Logout */}
      <div className="border-t border-base-300 p-2 bg-gradient-to-t from-slate-50 to-white">
        {user && !collapsed && (
          <div className="flex items-center gap-2 px-2 py-1 mb-1">
            <UserCircle size={20} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-base-content">{user.username}</p>
              <p className="text-xs text-base-content/50">
                {user.role === 'admin' ? 'مدیر' : 'کاربر'}
              </p>
            </div>
          </div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn btn-ghost btn-sm w-full justify-start gap-2 text-error hover:bg-error/10"
          >
            <LogOut size={16} />
            {!collapsed && <span className="text-xs">خروج</span>}
          </button>
        )}
      </div>
    </div>
  );
}
