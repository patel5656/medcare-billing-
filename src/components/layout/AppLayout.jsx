// src/components/layout/AppLayout.jsx
import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopHeader } from './TopHeader';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useSettings } from '../../utils/settingsCache';

export const AppLayout = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const location = useLocation();
  const settings = useSettings();

  // Enforce global language preference
  useEffect(() => {
    if (settings?.language) {
      const langCode = settings.language.split('-')[0];
      if (langCode !== 'en') {
        const checkAndApply = () => {
          const masterSelect = document.querySelector(".goog-te-combo");
          if (masterSelect && masterSelect.value !== langCode) {
            masterSelect.value = langCode;
            masterSelect.dispatchEvent(new Event("change"));
          } else if (!masterSelect) {
            // Check again shortly if widget isn't fully loaded
            setTimeout(checkAndApply, 500);
          }
        };
        setTimeout(checkAndApply, 200);
      } else {
        // If English, and the googtrans cookie exists (meaning it was previously translated), we MUST clear and reload
        if (document.cookie.includes('googtrans=')) {
          document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
          window.location.reload();
        }
      }
    }
  }, [settings?.language]);

  // Auto close sidebar on mobile navigation
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, setSidebarCollapsed]);

  return (
    <div className="app-shell flex flex-col bg-slate-50 font-sans antialiased text-slate-900 print:h-auto print:overflow-visible">
      {/* Top Header - 64px on mobile, 72px-80px on desktop */}
      <header className="h-16 sm:h-20 shrink-0 border-b border-slate-200 bg-white z-30 print:hidden">
        <TopHeader />
      </header>

      {/* Body Row: sidebar + main */}
      <div className="flex flex-1 min-h-0 relative print:block">
        {/* -- Mobile Overlay Backdrop -- */}
        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 top-16 sm:top-20 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Close sidebar"
          />
        )}

        {/* -- Sidebar -- */}
        <div
          className={`
            shrink-0 overflow-y-auto overscroll-contain bg-white border-r border-slate-200 print:hidden
            transition-all duration-300 ease-in-out
            fixed top-16 sm:top-20 left-0 bottom-0 z-50
            lg:static lg:top-auto lg:left-auto lg:bottom-auto lg:z-auto
            ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none lg:overflow-hidden' : 'translate-x-0 w-64 lg:w-64'}
          `}
        >
          <Sidebar />
        </div>

        {/* -- Main Content -- */}
        <main
          className="
            flex-1 min-w-0 min-h-0
            overflow-y-auto overscroll-y-contain
            bg-[#f8fafc] text-slate-900
            p-4 sm:p-6
            print:p-0 print:overflow-visible print:h-auto
          "
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
