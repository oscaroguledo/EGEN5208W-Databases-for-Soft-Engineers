import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MenuIcon } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { User } from '@/data/types';
type Page =
'login' |
'register' |
'member-dashboard' |
'member-profile' |
'member-health' |
'member-classes' |
'trainer-availability' |
'trainer-schedule' |
'admin-rooms' |
'admin-equipment' |
'not-found' |
'maintenance';
interface LayoutProps {
  currentUser: User | null;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
}
export function Layout({
  currentUser,
  currentPage,
  onNavigate,
  onLogout,
  children
}: LayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isLoggedIn = !!currentUser;
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      {isLoggedIn && (
        <Sidebar
          currentUser={currentUser}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onLogout={onLogout}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)} />
      )}

      <div className={`flex-1 min-h-screen flex flex-col ${isLoggedIn ? 'lg:ml-64' : ''}`}>
        {/* Mobile top bar */}
        <motion.header
          className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}>

          {isLoggedIn && (
            <motion.button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Open menu"
              whileTap={{ scale: 0.9 }}>

              <MenuIcon className="w-5 h-5" />
            </motion.button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-teal-500 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm">
              FitClub
            </span>
          </div>
        </motion.header>

        <main className="flex-1 w-full">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>);

}