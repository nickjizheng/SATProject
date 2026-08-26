import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { lazy, Suspense, useState } from 'react';
import Navigation from './components/Navigation';
import { AccountFeatureRoute } from './components/guest/AccountFeaturePreview';
import LandingPage from './pages/LandingPage';
import TrademarkNotice from './components/TrademarkNotice';
import './App.css';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SatPracticePage = lazy(() => import('./pages/SatPracticePage'));
const SatSingleQuestionPage = lazy(() => import('./pages/SatSingleQuestionPage'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));
const ExamCoachPage = lazy(() => import('./pages/ExamCoachPage'));
const PacingLabPage = lazy(() => import('./pages/PacingLabPage'));
const MistakeLabPage = lazy(() => import('./pages/MistakeLabPage'));
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
            <Route path="/home" element={<HomePage />} />
            <Route path="/dashboard" element={<AccountFeatureRoute feature="dashboard"><Dashboard /></AccountFeatureRoute>} />
            <Route path="/sat-practice" element={<SatPracticePage />} />
            <Route path="/sat-single" element={<SatSingleQuestionPage />} />
            <Route path="/review" element={<AccountFeatureRoute feature="review"><ReviewPage /></AccountFeatureRoute>} />
            <Route path="/exam-coach" element={<ExamCoachPage />} />
            <Route path="/pacing-lab" element={<PacingLabPage />} />
            <Route path="/mistakes" element={<AccountFeatureRoute feature="mistakes"><MistakeLabPage /></AccountFeatureRoute>} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/favorite-words" element={<AccountFeatureRoute feature="favorite-words"><FavoriteWordsPage /></AccountFeatureRoute>} />
            <Route path="/favorite-questions" element={<AccountFeatureRoute feature="favorite-questions"><FavoriteQuestionsPage /></AccountFeatureRoute>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
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
