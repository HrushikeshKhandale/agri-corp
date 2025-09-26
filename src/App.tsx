import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Showrooms from './pages/Showrooms';
import Orders from './pages/Orders';
import Employees from './pages/Employees';
import Transfers from './pages/Transfers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import CreateBill from './pages/CreateBill';
import Customers from './pages/Customers';
import { Users } from 'lucide-react';
import BillsList from './pages/bill/BillsList';
import StockManagement from './pages/StockManagement';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  
  if (authState.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/stock/products" element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        } />
        
        <Route path="/showrooms" element={
          <ProtectedRoute>
            <Showrooms />
          </ProtectedRoute>
        } />
        
        <Route path="/stock/add-stocks" element={
          <ProtectedRoute>
            <StockManagement />
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        } />      
        <Route path="/bill/new-bill" element={
          <ProtectedRoute>
            <CreateBill />
          </ProtectedRoute>
        } />
           <Route path="/bill/history" element={
          <ProtectedRoute>
            <BillsList />
          </ProtectedRoute>
        } />
        <Route
                path="/employees/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />

          <Route path="/customers" element={
          <ProtectedRoute>
            <Customers />
          </ProtectedRoute>
        } />
        
        
        <Route path="/employees" element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        } />
        
        <Route path="/stock/transfers" element={
          <ProtectedRoute>
            <Transfers />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

// Ant Design theme configuration
const antdTheme = {
  token: {
    colorPrimary: 'hsl(120, 60%, 35%)',
    colorSuccess: 'hsl(120, 60%, 35%)',
    colorWarning: 'hsl(45, 90%, 55%)',
    colorError: 'hsl(0, 70%, 50%)',
    colorInfo: 'hsl(210, 90%, 55%)',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  }
};

const App = () => (
  <ConfigProvider theme={antdTheme}>
    <AuthProvider>
      <DataProvider>
        <AppRoutes />
      </DataProvider>
    </AuthProvider>
  </ConfigProvider>
);

export default App;
