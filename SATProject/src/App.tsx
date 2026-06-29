import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import enUS from 'antd/locale/en_US';
import { useState } from 'react';
import Navigation from './components/Navigation';
import AuthGuard from './components/AuthGuard';
import HomePage from './pages/HomePage';
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

const { Content } = Layout;

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="App">
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation collapsed={collapsed} onCollapse={setCollapsed} />
        <Layout style={{ marginLeft: isAuthPage ? 0 : collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
              <Content style={{
                margin: 0,
                padding: 0,
                background: '#f5f5f5',
                minHeight: '100vh'
              }}>
                <Routes>
                  {/* 默认重定向到登录页面 */}
                  <Route path="/" element={<Navigate to="/auth?mode=login" replace />} />
                  <Route path="/auth" element={<AuthPage />} />

                  {/* 需要登录的页面 */}
                  <Route path="/home" element={
                    <AuthGuard>
                      <HomePage />
                    </AuthGuard>
                  } />
                  <Route path="/dashboard" element={
                    <AuthGuard>
                      <Dashboard />
                    </AuthGuard>
                  } />
                  <Route path="/test" element={
                    <AuthGuard>
                      <TestPage />
                    </AuthGuard>
                  } />
                  <Route path="/sat-practice" element={
                    <AuthGuard>
                      <SatPracticePage />
                    </AuthGuard>
                  } />
                  <Route path="/sat-single" element={
                    <AuthGuard>
                      <SatSingleQuestionPage />
                    </AuthGuard>
                  } />
                  <Route path="/sat-debug" element={
                    <AuthGuard>
                      <SatDebugPage />
                    </AuthGuard>
                  } />
                  <Route path="/dictionary" element={
                    <AuthGuard>
                      <DictionaryPage />
                    </AuthGuard>
                  } />
                  <Route path="/favorite-words" element={
                    <AuthGuard>
                      <FavoriteWordsPage />
                    </AuthGuard>
                  } />
                  <Route path="/favorite-questions" element={
                    <AuthGuard>
                      <FavoriteQuestionsPage />
                    </AuthGuard>
                  } />

                  {/* 404重定向到登录页面 */}
                  <Route path="*" element={<Navigate to="/auth?mode=login" replace />} />
                </Routes>
              </Content>
        </Layout>
      </Layout>
    </div>
  );
}

function App() {
  return (
    <ConfigProvider locale={enUS}>
      <Router>
        <AppLayout />
      </Router>
    </ConfigProvider>
  );
}

export default App
