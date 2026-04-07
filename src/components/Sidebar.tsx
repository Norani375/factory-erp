"use client";
import React from 'react';
import {
  LayoutDashboard, Package, Wrench, Users, ShoppingCart,
  CreditCard, BarChart3, ClipboardList, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Page } from '@/app/page';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard size={20} /> },
  { page: 'products', label: 'محصولات نهایی', icon: <Package size={20} /> },
  { page: 'materials', label: 'مواد مصرفی', icon: <Wrench size={20} /> },
  { page: 'bom', label: 'فرمول ساخت (BOM)', icon: <ClipboardList size={20} /> },
  { page: 'customers', label: 'مشتریان', icon: <Users size={20} /> },
  { page: 'sales', label: 'فروش و فاکتور', icon: <ShoppingCart size={20} /> },
  { page: 'debts', label: 'بدهی\u200cها', icon: <CreditCard size={20} /> },
  { page: 'reports', label: 'گزارشات', icon: <BarChart3 size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <div className={`bg-base-200 h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      <div className="flex items-center justify-between p-3 border-b border-base-300">
        {!collapsed && <span className="font-bold text-sm text-primary">🪵 نجاری ERP</span>}
        <button className="btn btn-ghost btn-xs" onClick={onToggle}>
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      <ul className="menu gap-1 p-2 flex-1">
        {menuItems.map((item) => (
          <li key={item.page}>
            <a
              className={`flex items-center gap-3 ${currentPage === item.page ? 'active' : ''}`}
              onClick={() => onNavigate(item.page)}
            >
              {item.icon}
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
