import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Breadcrumbs } from './Breadcrumbs';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { storage } from '../../utils/storage';
import './MainLayout.css';

export const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    storage.getSidebarCollapsed()
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toggle desktop sidebar collapse
  const handleToggleSidebar = () => {
    // If mobile/tablet, toggle the mobile drawer
    if (window.innerWidth <= 992) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        storage.setSidebarCollapsed(next);
        return next;
      });
    }
  };

  // Close mobile sidebar on resize if screen becomes large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992 && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileSidebarOpen]);

  return (
    <div className="crm-layout">
      {/* Dynamic Responsive Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Page Area */}
      <div
        className={`crm-main-content-wrapper ${
          isSidebarCollapsed ? 'sidebar-collapsed' : ''
        }`}
      >
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="crm-page-container">
          <Breadcrumbs />
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
