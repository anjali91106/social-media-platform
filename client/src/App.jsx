import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import HomeFeed from './pages/HomeFeed';
import Profile from './pages/Profile';
import SearchResults from './pages/SearchResults';
import CreatePostPage from './pages/CreatePostPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/feed" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <HomeFeed />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <HomeFeed />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Profile />
                  </>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <Profile />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Create Post Page Route */}
            <Route
              path="/create-post"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <CreatePostPage />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Settings Page Route */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <SettingsPage />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Search Results Route */}
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <>
                    <Navigation />
                    <SearchResults />
                  </>
                </ProtectedRoute>
              }
            />

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/feed" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
