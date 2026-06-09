import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Analytics from './pages/Analytics';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

// Authentication Guard
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route path="/auth" element={<Auth />} />

        {/* Dashboard Routes wrapped in RequireAuth & Layout */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout>
                <Dashboard />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/applications"
          element={
            <RequireAuth>
              <Layout>
                <Applications />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <Layout>
                <Analytics />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/insights"
          element={
            <RequireAuth>
              <Layout>
                <Insights />
              </Layout>
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Layout>
                <Settings />
              </Layout>
            </RequireAuth>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
