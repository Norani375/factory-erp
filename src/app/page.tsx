"use client";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Products from '@/components/Products';
import Materials from '@/components/Materials';
import Customers from '@/components/Customers';
import Sales from '@/components/Sales';
import Debts from '@/components/Debts';
import Reports from '@/components/Reports';
import BOM from '@/components/BOM';

export type Page = 'dashboard' | 'products' | 'materials' | 'customers' | 'sales' | 'debts' | 'reports' | 'bom';

interface UserInfo {
  userId: number;
  username: string;
  role: string;
}

export default function Home() {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.authenticated) setUser(data.user); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  function renderPage() {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <Products />;
      case 'materials': return <Materials />;
      case 'customers': return <Customers />;
      case 'sales': return <Sales />;
      case 'debts': return <Debts />;
      case 'reports': return <Reports />;
      case 'bom': return <BOM />;
      default: return <Dashboard />;
    }
  }

  return (
    <div className="flex h-screen bg-base-100 overflow-hidden">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>
    </div>
  );
}
