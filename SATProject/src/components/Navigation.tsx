import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpenText,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Heart,
  Home,
  LibraryBig,
  LogOut,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const navItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { path: '/sat-practice', label: 'Practice', icon: BookOpenText },
  { path: '/sat-single', label: 'Quick question', icon: Sparkles },
  { path: '/dictionary', label: 'Dictionary', icon: Search },
  { path: '/favorite-words', label: 'Saved words', icon: Heart },
  { path: '/favorite-questions', label: 'Saved questions', icon: Star },
];

export default function Navigation({ collapsed, onCollapse }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<{ username?: string; email?: string } | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    try {
      setUserInfo(user ? JSON.parse(user) : null);
    } catch {
      setUserInfo(null);
    }
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    navigate('/auth?mode=login');
  };

  return (
    <>
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 88 : 272 }}
      transition={{ type: 'spring', stiffness: 310, damping: 30 }}
      className="fixed inset-y-0 left-0 z-50 hidden border-r border-stone-900/10 bg-[#173c39] text-white shadow-[18px_0_60px_rgba(26,48,45,.12)] md:flex md:flex-col"
    >
      <button onClick={() => navigate('/home')} className="flex h-24 w-full items-center gap-3 px-6 text-left">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#f4d8cc] text-[#a83f2b] shadow-inner">
          <LibraryBig size={22} strokeWidth={2.2} />
        </span>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="overflow-hidden whitespace-nowrap">
              <strong className="block font-display text-[1.65rem] font-medium leading-none tracking-tight">PeakSAT</strong>
              <small className="mt-1 block text-[10px] font-bold uppercase tracking-[.2em] text-teal-100/55">Study studio</small>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ path, label, icon: Icon }, index) => {
          const active = location.pathname === path;
          return (
            <motion.button
              key={path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.035 }}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
              className={cn(
                'group relative flex h-12 w-full items-center gap-3 overflow-hidden rounded-2xl px-3 text-sm font-bold transition-colors',
                active ? 'bg-[#f5f2e9] text-[#173c39]' : 'text-teal-50/68 hover:bg-white/8 hover:text-white',
              )}
            >
              {active && <motion.span layoutId="nav-marker" className="absolute left-0 h-6 w-1 rounded-r-full bg-[#e96b4d]" />}
              <Icon size={20} className="shrink-0" strokeWidth={active ? 2.4 : 1.8} />
              {!collapsed && <span className="truncate">{label}</span>}
            </motion.button>
          );
        })}
      </nav>

      <div className="m-3 rounded-[1.4rem] border border-white/10 bg-white/6 p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f4d8cc]"><CircleUserRound size={21} /></span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{userInfo?.username || 'Student'}</p>
              <p className="truncate text-[10px] text-teal-50/45">{userInfo?.email || 'Ready to practise'}</p>
            </div>
          )}
          {!collapsed && <button onClick={logout} title="Log out" className="rounded-lg p-2 text-teal-50/50 hover:bg-white/10 hover:text-white"><LogOut size={17} /></button>}
        </div>
      </div>

      <button onClick={() => onCollapse(!collapsed)} className="mx-3 mb-4 flex h-10 items-center justify-center rounded-xl border border-white/10 text-teal-50/55 hover:bg-white/8 hover:text-white">
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>

    <nav className="fixed inset-x-3 bottom-3 z-50 flex h-16 items-center gap-1 overflow-x-auto rounded-[1.35rem] border border-white/10 bg-[#173c39]/95 px-2 text-white shadow-[0_18px_55px_rgba(23,60,57,.28)] backdrop-blur-xl md:hidden">
      {navItems.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={cn('flex min-w-[68px] flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[9px] font-bold', active ? 'bg-[#f5f2e9] text-[#173c39]' : 'text-white/60')}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            <span className="whitespace-nowrap">{label.replace(' question', '')}</span>
          </button>
        );
      })}
    </nav>
    </>
  );
}
