import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const HomeFeed = lazy(() => import('./pages/HomeFeed'));
const Profile = lazy(() => import('./pages/Profile'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const CreatePostPage = lazy(() => import('./pages/CreatePostPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Loading component for lazy loaded components
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

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
                  <Suspense fallback={<PageLoader />}>
                    <Login />
                  </Suspense>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Suspense fallback={<PageLoader />}>
                    <Register />
                  </Suspense>
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
                    <Suspense fallback={<PageLoader />}>
                      <HomeFeed />
                    </Suspense>
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
                    <Suspense fallback={<PageLoader />}>
                      <HomeFeed />
                    </Suspense>
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
                    <Suspense fallback={<PageLoader />}>
                      <Profile />
                    </Suspense>
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
                    <Suspense fallback={<PageLoader />}>
                      <Profile />
                    </Suspense>
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
                    <Suspense fallback={<PageLoader />}>
                      <CreatePostPage />
                    </Suspense>
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
                    <Suspense fallback={<PageLoader />}>
                      <SettingsPage />
                    </Suspense>
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
                    <Suspense fallback={<PageLoader />}>
                      <SearchResults />
                    </Suspense>
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
