import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';

export const DashboardLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // For HR role, maintain the selected company across pages
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading placement workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          selectedCompanyId={selectedCompanyId}
          onCompanyChange={(id) => setSelectedCompanyId(id)}
        />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ selectedCompanyId, setSelectedCompanyId }} />
        </main>
      </div>
    </div>
  );
};
