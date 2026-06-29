import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import { useState } from 'react';
import Navigation from './components/Navigation';
import AuthGuard from './components/AuthGuard';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TestPage from './components/TestPage';
import SatPracticePage from './pages/SatPracticePage';
import SatSingleQuestionPage from './pages/SatSingleQuestionPage';
import SatDebugPage from './pages/SatDebugPage';
import DictionaryPage from './pages/DictionaryPage';
import FavoriteWordsPage from './pages/FavoriteWordsPage';
import FavoriteQuestionsPage from './pages/FavoriteQuestionsPage';
import './App.css';

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
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/home" element={<AuthGuard><HomePage /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/test" element={<AuthGuard><TestPage /></AuthGuard>} />
            <Route path="/sat-practice" element={<AuthGuard><SatPracticePage /></AuthGuard>} />
            <Route path="/sat-single" element={<AuthGuard><SatSingleQuestionPage /></AuthGuard>} />
            <Route path="/sat-debug" element={<AuthGuard><SatDebugPage /></AuthGuard>} />
            <Route path="/dictionary" element={<AuthGuard><DictionaryPage /></AuthGuard>} />
            <Route path="/favorite-words" element={<AuthGuard><FavoriteWordsPage /></AuthGuard>} />
            <Route path="/favorite-questions" element={<AuthGuard><FavoriteQuestionsPage /></AuthGuard>} />
            <Route path="*" element={<Navigate to="/auth?mode=login" replace />} />
          </Routes>
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
          colorPrimary: '#0f766e',
          colorInfo: '#0f766e',
          colorSuccess: '#2f855a',
          colorWarning: '#d97706',
          colorError: '#dc5d45',
          colorText: '#1f2927',
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
