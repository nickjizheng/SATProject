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
  MoreHorizontal,
  Search,
  Sparkles,
  Star,
} from 'lucide-react';
import { cn } from '../lib/utils';
import AccountModal, { type AccountUser } from './AccountModal';
import Brand from './Brand';
import { getUserPreferences, PREFERENCES_EVENT } from '../utils/userPreferences';

interface NavigationProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const navItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/dashboard', label: 'Dashboard', icon: ChartNoAxesCombined },
  { path: '/sat-practice', label: 'Practice', icon: BookOpenText },
  { path: '/sat-single', label: 'Daily quick', icon: Sparkles },
  { path: '/dictionary', label: 'Dictionary', icon: Search },
  { path: '/favorite-words', label: 'Saved words', icon: Heart },
  { path: '/favorite-questions', label: 'Saved questions', icon: Star },
];

const mobilePrimaryItems = [
  { ...navItems[0], mobileLabel: 'Home' },
  { ...navItems[1], mobileLabel: 'Progress' },
  { ...navItems[2], mobileLabel: 'Practice' },
  { ...navItems[3], mobileLabel: 'Quick' },
];

const mobileMoreItems = navItems.slice(4);

export default function Navigation({ collapsed, onCollapse }: NavigationProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<AccountUser | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [displayName, setDisplayName] = useState(() => getUserPreferences().displayName);

  useEffect(() => {
    const user = localStorage.getItem('user');
    try {
      setUserInfo(user ? JSON.parse(user) : null);
    } catch {
      setUserInfo(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    const updatePreferences = () => setDisplayName(getUserPreferences().displayName);
    window.addEventListener(PREFERENCES_EVENT, updatePreferences);
    return () => window.removeEventListener(PREFERENCES_EVENT, updatePreferences);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    navigate('/auth?mode=login');
  };

  const navigateFromMobile = (path: string) => {
    setMobileMoreOpen(false);
    navigate(path);
  };

  return (
    <>
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 88 : 272 }}
      transition={{ type: 'spring', stiffness: 310, damping: 30 }}
      className="fixed inset-y-0 left-0 z-50 hidden border-r border-stone-900/10 bg-[#173c39] text-white shadow-[18px_0_60px_rgba(26,48,45,.12)] lg:flex lg:flex-col"
    >
      <button onClick={() => navigate('/home')} className="flex h-24 w-full items-center gap-3 px-6 text-left">
        <Brand compact={collapsed} inverse />
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

      <button
        type="button"
        onClick={() => setAccountOpen(true)}
        title={collapsed ? 'Open profile and settings' : undefined}
        className="m-3 rounded-[1.4rem] border border-white/10 bg-white/6 p-3 text-left transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f4d8cc]"><CircleUserRound size={21} /></span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{displayName || userInfo?.username || 'Student'}</p>
              <p className="truncate text-[10px] text-teal-50/45">{userInfo?.email || 'Ready to practise'}</p>
            </div>
          )}
        </div>
      </button>

      <button onClick={() => onCollapse(!collapsed)} className="mx-3 mb-4 flex h-10 items-center justify-center rounded-xl border border-white/10 text-teal-50/55 hover:bg-white/8 hover:text-white">
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>

    <AnimatePresence>
      {mobileMoreOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close more navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMoreOpen(false)}
            className="fixed inset-0 z-40 bg-stone-950/25 backdrop-blur-[2px] lg:hidden"
          />
          <motion.div
            role="dialog"
            aria-label="More navigation"
            initial={{ opacity: 0, y: 18, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: .98 }}
            className="mobile-more-panel fixed inset-x-3 z-50 rounded-[1.5rem] border border-stone-900/10 bg-[#fffdf8]/96 p-3 text-[#173c39] shadow-[0_24px_70px_rgba(23,60,57,.28)] backdrop-blur-xl lg:hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {mobileMoreItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <button
                    type="button"
                    key={path}
                    onClick={() => navigateFromMobile(path)}
                    className={cn('flex min-h-12 items-center gap-2 rounded-xl px-3 text-left text-xs font-extrabold', active ? 'bg-[#173c39] text-white' : 'bg-stone-900/5')}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{label}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  setMobileMoreOpen(false);
                  setAccountOpen(true);
                }}
                className="col-span-2 flex min-h-12 items-center gap-2 rounded-xl bg-[#e6d8bb]/45 px-3 text-left text-xs font-extrabold"
              >
                <CircleUserRound size={18} />
                Profile & settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    <nav className="mobile-nav fixed inset-x-3 z-50 grid h-16 grid-cols-5 items-center gap-1 rounded-[1.35rem] border border-white/10 bg-[#173c39]/95 px-2 text-white shadow-[0_18px_55px_rgba(23,60,57,.28)] backdrop-blur-xl lg:hidden">
      {mobilePrimaryItems.map(({ path, mobileLabel, icon: Icon }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigateFromMobile(path)}
            className={cn('flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[9px] font-bold', active ? 'bg-[#f5f2e9] text-[#173c39]' : 'text-white/60')}
          >
            <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
            <span className="max-w-full truncate">{mobileLabel}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => setMobileMoreOpen(value => !value)}
        aria-expanded={mobileMoreOpen}
        className={cn('flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[9px] font-bold', mobileMoreItems.some(item => item.path === location.pathname) || mobileMoreOpen ? 'bg-[#f5f2e9] text-[#173c39]' : 'text-white/60')}
      >
        <MoreHorizontal size={18} />
        <span>More</span>
      </button>
    </nav>
    <AccountModal
      open={accountOpen}
      user={userInfo}
      onClose={() => setAccountOpen(false)}
      onLogout={logout}
      onProfileSaved={setDisplayName}
    />
    </>
  );
}
