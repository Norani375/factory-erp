'use client';

import React, { useState } from 'react';
import Sidebar, { Page } from '@/components/Sidebar';
import { ToastProvider } from '@/components/Toast';
import Dashboard from '@/components/Dashboard';
import Products from '@/components/Products';
import Materials from '@/components/Materials';
import BOM from '@/components/BOM';
import Customers from '@/components/Customers';
import Sales from '@/components/Sales';
import Debts from '@/components/Debts';
import Expenses from '@/components/Expenses';
import Reports from '@/components/Reports';
import SettingsPage from '@/components/Settings';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'products':
        return <Products />;
      case 'materials':
        return <Materials />;
      case 'bom':
        return <BOM />;
      case 'customers':
        return <Customers />;
      case 'sales':
        return <Sales />;
      case 'debts':
        return <Debts />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-base-100">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </ToastProvider>
  );
}
