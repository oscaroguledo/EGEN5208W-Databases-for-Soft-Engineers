import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboardIcon,
  ActivityIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  DoorOpenIcon,
  WrenchIcon,
  LogOutIcon,
  DumbbellIcon,
  SunIcon,
  MoonIcon,
  XIcon } from
'lucide-react';
import { RoleBadge } from './ui/Badge';
import { User } from '../data/types';
import { useTheme } from './ThemeProvider';
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
interface SidebarProps {
  currentUser: User;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}
interface NavItem {
  page: Page;
  label: string;
  icon: React.ReactNode;
}
const memberNav: NavItem[] = [
{
  page: 'member-dashboard',
  label: 'Dashboard',
  icon: <LayoutDashboardIcon className="w-4 h-4" />
},
{
  page: 'member-classes',
  label: 'Classes',
  icon: <DumbbellIcon className="w-4 h-4" />
},
{
  page: 'member-health',
  label: 'Health History',
  icon: <ActivityIcon className="w-4 h-4" />
},
{
  page: 'member-profile',
  label: 'Profile',
  icon: <UserIcon className="w-4 h-4" />
}];

const trainerNav: NavItem[] = [
{
  page: 'trainer-schedule',
  label: 'My Schedule',
  icon: <CalendarIcon className="w-4 h-4" />
},
{
  page: 'trainer-availability',
  label: 'Set Availability',
  icon: <ClockIcon className="w-4 h-4" />
}];

const adminNav: NavItem[] = [
{
  page: 'admin-rooms',
  label: 'Room Booking',
  icon: <DoorOpenIcon className="w-4 h-4" />
},
{
  page: 'admin-equipment',
  label: 'Equipment',
  icon: <WrenchIcon className="w-4 h-4" />
}];

const navItemVariants = {
  initial: {
    opacity: 0,
    x: -12
  },
  animate: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.06 + 0.1,
      duration: 0.25,
      ease: 'easeOut'
    }
  })
};
export function Sidebar({
  currentUser,
  currentPage,
  onNavigate,
  onLogout,
  mobileOpen = false,
  onMobileClose
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const navItems =
  currentUser.role === 'member' ?
  memberNav :
  currentUser.role === 'trainer' ?
  trainerNav :
  adminNav;
  const handleNavigate = (page: Page) => {
    onNavigate(page);
    onMobileClose?.();
  };
  // Get display name from email (username is stored as email)
  const displayName = currentUser.username.includes('@') ?
  currentUser.username.split('@')[0] :
  currentUser.username;
  const sidebarContent =
  <aside
    className="h-full w-64 flex flex-col z-40"
    style={{
      backgroundColor: '#1a1f2e'
    }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
          className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30"
          whileHover={{
            scale: 1.05
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17
          }}>

            <DumbbellIcon className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight tracking-wide">
              FitClub
            </div>
            <div className="text-slate-500 text-xs">Management System</div>
          </div>
        </div>
        {onMobileClose &&
      <motion.button
        onClick={onMobileClose}
        className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        whileTap={{
          scale: 0.9
        }}>

            <XIcon className="w-5 h-5" />
          </motion.button>
      }
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-md"
          initial={{
            scale: 0.8,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20
          }}>

            {displayName.charAt(0).toUpperCase()}
          </motion.div>
          <div className="min-w-0">
            <div className="text-white text-sm font-medium truncate capitalize">
              {displayName}
            </div>
            <div className="text-slate-400 text-xs truncate">
              {currentUser.username}
            </div>
            <RoleBadge role={currentUser.role} />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-3">
          {currentUser.role === 'member' ?
        'Member Portal' :
        currentUser.role === 'trainer' ?
        'Trainer Portal' :
        'Admin Portal'}
        </div>
        {navItems.map((item, i) =>
      <motion.button
        key={item.page}
        custom={i}
        variants={navItemVariants}
        initial="initial"
        animate="animate"
        onClick={() => handleNavigate(item.page)}
        className={`sidebar-item w-full text-left ${currentPage === item.page ? 'active' : ''}`}
        whileTap={{
          scale: 0.97
        }}>

            {item.icon}
            {item.label}
            {currentPage === item.page &&
        <motion.div
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60"
          layoutId="activeIndicator"
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30
          }} />

        }
          </motion.button>
      )}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-3 border-t border-white/10 pt-3 space-y-1">
        <motion.button
        onClick={toggleTheme}
        className="sidebar-item w-full text-left"
        title={
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
        }
        whileTap={{
          scale: 0.97
        }}>

          <AnimatePresence mode="wait" initial={false}>
            {theme === 'dark' ?
          <motion.span
            key="sun"
            initial={{
              rotate: -90,
              opacity: 0
            }}
            animate={{
              rotate: 0,
              opacity: 1
            }}
            exit={{
              rotate: 90,
              opacity: 0
            }}
            transition={{
              duration: 0.2
            }}>

                <SunIcon className="w-4 h-4" />
              </motion.span> :

          <motion.span
            key="moon"
            initial={{
              rotate: 90,
              opacity: 0
            }}
            animate={{
              rotate: 0,
              opacity: 1
            }}
            exit={{
              rotate: -90,
              opacity: 0
            }}
            transition={{
              duration: 0.2
            }}>

                <MoonIcon className="w-4 h-4" />
              </motion.span>
          }
          </AnimatePresence>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </motion.button>

        <motion.button
        onClick={onLogout}
        className="sidebar-item w-full text-left"
        whileTap={{
          scale: 0.97
        }}>

          <LogOutIcon className="w-4 h-4" />
          Sign Out
        </motion.button>
        <div className="mt-2 px-3 text-xs text-slate-600 text-center">
          FitClub v1.0 · 2026
        </div>
      </div>
    </aside>;

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-64">
        {sidebarContent}
      </div>

      {/* Mobile sidebar with AnimatePresence */}
      <AnimatePresence>
        {mobileOpen &&
        <>
            {/* Overlay */}
            <motion.div
            className="sidebar-overlay lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 0.2
            }} />

            {/* Panel */}
            <motion.div
            className="fixed top-0 left-0 h-full w-64 z-40 lg:hidden"
            initial={{
              x: -256
            }}
            animate={{
              x: 0
            }}
            exit={{
              x: -256
            }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 35
            }}>

              {sidebarContent}
            </motion.div>
          </>
        }
      </AnimatePresence>
    </>);

}