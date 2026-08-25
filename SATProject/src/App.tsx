import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { lazy, Suspense, useState } from 'react';
import Navigation from './components/Navigation';
import AuthGuard from './components/AuthGuard';
import LandingPage from './pages/LandingPage';
import TrademarkNotice from './components/TrademarkNotice';
import './App.css';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SatPracticePage = lazy(() => import('./pages/SatPracticePage'));
const SatSingleQuestionPage = lazy(() => import('./pages/SatSingleQuestionPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const DictionaryPage = lazy(() => import('./pages/DictionaryPage'));
const FavoriteWordsPage = lazy(() => import('./pages/FavoriteWordsPage'));
const FavoriteQuestionsPage = lazy(() => import('./pages/FavoriteQuestionsPage'));

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isAuthRoute = location.pathname === '/auth';
  const hasAppChrome = location.pathname !== '/' && !isAuthRoute;

  return (
    <div className={`App app-shell ${collapsed ? 'is-collapsed' : ''} ${!hasAppChrome ? 'is-auth' : ''}`}>
      {hasAppChrome && <Navigation collapsed={collapsed} onCollapse={setCollapsed} />}
      <main className="app-main">
        <div className="route-stage">
          <Suspense fallback={<div className="grid min-h-[70vh] place-items-center"><div className="text-center"><span className="mx-auto block size-9 animate-spin rounded-full border-2 border-[#123d3a]/20 border-t-[#123d3a]" /><p className="mt-4 text-sm font-bold text-stone-500">Preparing your study space…</p></div></div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/home" element={<AuthGuard><HomePage /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/sat-practice" element={<AuthGuard><SatPracticePage /></AuthGuard>} />
            <Route path="/sat-single" element={<AuthGuard><SatSingleQuestionPage /></AuthGuard>} />
            <Route path="/review" element={<AuthGuard><ReviewPage /></AuthGuard>} />
            <Route path="/resources" element={<AuthGuard><ResourcesPage /></AuthGuard>} />
            <Route path="/dictionary" element={<AuthGuard><DictionaryPage /></AuthGuard>} />
            <Route path="/favorite-words" element={<AuthGuard><FavoriteWordsPage /></AuthGuard>} />
            <Route path="/favorite-questions" element={<AuthGuard><FavoriteQuestionsPage /></AuthGuard>} />
            <Route path="*" element={<Navigate to="/auth?mode=login" replace />} />
          </Routes>
          </Suspense>
          {hasAppChrome && location.pathname !== '/resources' && <TrademarkNotice className="app-trademark-notice" />}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        token: {
          colorPrimary: '#123d3a',
          colorInfo: '#123d3a',
          colorSuccess: '#2f855a',
          colorWarning: '#d97706',
          colorError: '#e07a5f',
          colorText: '#2a2a2a',
          colorTextSecondary: '#6f7976',
          colorBgContainer: '#fffdf8',
          borderRadius: 12,
          fontFamily: '"Manrope Variable", sans-serif',
        },
      }}
    >
      <Router><AppShell /></Router>
    </ConfigProvider>
  );
}

export default App;
