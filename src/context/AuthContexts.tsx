import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { login as loginService } from "../services/authService";

 // src/context/AuthContext.tsx

const permissions = {
  'ADMIN': [
    'view_dashboard',
    'create_bill',
    'view_bill_history',
    'view_products',
    'manage_products',
    'add_stocks',
    'view_transfers',
    'request_transfers',
    'view_orders',
    'manage_orders',
    'view_showrooms',
    'manage_showrooms',
    'view_employees',
    'manage_employees',
    'view_attendance',
    'manage_attendance',
    'view_salary',
    'view_reports',
    'add_customer',
    'view_customers',
    'edit_customer',
    'download_bill_pdf',
    'print_bill',
    'view_stock_alerts',
    'export_report_pdf',
    'print_report',
    'manage_settings',
    'manage_users'
  ],
  'USER': [
    'view_dashboard',
    'create_bill',
    'view_bill_history',
    'view_products',
    'view_orders',
    'view_attendance',
    'mark_attendance',
    'view_salary',
    'view_profile',
    'view_customers',
    'view_transfers'
  ]
};

interface AuthContextType {
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  user: { username: string; role: string } | null; // 👈 Typed for clarity
  role: string | null;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
        setRole(parsedUser.role || null);
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    try {
      const authData = await loginService({
        username: credentials.username,
        password: credentials.password,
      });

      // Save token and flat user info
      localStorage.setItem("authToken", authData.token);
      localStorage.setItem("user", JSON.stringify({
        username: authData.username,
        role: authData.role
      }));

      setIsAuthenticated(true);
      setUser({
        username: authData.username,
        role: authData.role
      });
      setRole(authData.role);

      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!role) return false;
    const rolePermissions = permissions[role as keyof typeof permissions] || [];
    return rolePermissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      login,
      logout,
      isAuthenticated,
      user,
      role,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};