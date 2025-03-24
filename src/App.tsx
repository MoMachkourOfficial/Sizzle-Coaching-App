import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Flame } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import CallList from './pages/CallList';
import Assignments from './pages/Assignments';
import ReportNumbers from './pages/ReportNumbers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import GHLTest from './pages/GHLTest';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  return session ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="h-8 w-8 text-orange-500" />
                  <span className="text-2xl font-bold text-gray-900">Sizzle</span>
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/pipeline"
                element={
                  <PrivateRoute>
                    <Pipeline />
                  </PrivateRoute>
                }
              />
              <Route
                path="/calls"
                element={
                  <PrivateRoute>
                    <CallList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assignments"
                element={
                  <PrivateRoute>
                    <Assignments />
                  </PrivateRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <PrivateRoute>
                    <ReportNumbers />
                  </PrivateRoute>
                }
              />
              <Route
                path="/report/:id"
                element={
                  <PrivateRoute>
                    <ReportNumbers />
                  </PrivateRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivateRoute>
                    <Reports />
                  </PrivateRoute>
                }
              />
              <Route
                path="/contacts"
                element={
                  <PrivateRoute>
                    <Contacts />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ghl-test"
                element={
                  <PrivateRoute>
                    <GHLTest />
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App
