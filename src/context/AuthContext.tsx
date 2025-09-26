import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalStorageService, STORAGE_KEYS } from '../utils/localStorage';
import { message } from 'antd';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Super Admin' | 'Showroom Admin' | 'Employee';
  showroomId?: string;
  avatar?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: Omit<User, 'password'> | null;
  role: string | null;
  showroomId: string | null;
  users: User[];
}

interface AuthContextType {
  authState: AuthState;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string, context?: { toShowroomId?: string }) => boolean;
  addUser: (user: Omit<User, 'id'>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Super Admin',
    email: 'admin@agrierp.com',
    password: 'admin123',
    role: 'Super Admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
  },
  {
    id: '2',
    name: 'Mumbai Store Manager',
    email: 'mumbai@agrierp.com',
    password: 'mumbai123',
    role: 'Showroom Admin',
    showroomId: '1',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
  },
  {
    id: '3',
    name: 'Punjab Store Manager',
    email: 'punjab@agrierp.com',
    password: 'punjab123',
    role: 'Showroom Admin',
    showroomId: '2',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
  },
  {
    id: '4',
    name: 'Store Employee',
    email: 'employee@agrierp.com',
    password: 'emp123',
    role: 'Employee',
    showroomId: '1',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c96d?w=400'
  }
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    return LocalStorageService.get(STORAGE_KEYS.AUTH, {
      isAuthenticated: false,
      user: null,
      role: null,
      showroomId: null,
      users: [],
    });
  });

  useEffect(() => {
    console.log('Saving authState to localStorage:', authState);
    LocalStorageService.set(STORAGE_KEYS.AUTH, authState);
  }, [authState]);

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    console.log('Adding new user:', newUser);
    setAuthState(prev => {
      const updatedUsers = [...(prev.users || []), newUser];
      console.log('Updated authState.users:', updatedUsers);
      return {
        ...prev,
        users: updatedUsers,
      };
    });
    message.success('Showroom admin created successfully');
  };

  const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
    console.log('Login attempt with credentials:', credentials);
    console.log('MOCK_USERS:', MOCK_USERS);
    console.log('authState.users:', authState.users);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = [
      ...MOCK_USERS,
      ...(authState.users || [])
    ].find(u => u.email === credentials.email && u.password === credentials.password);

    if (user) {
      console.log('Found user:', user);
      const { password, ...userWithoutPassword } = user;
      const newAuthState = {
        ...authState,
        isAuthenticated: true,
        user: userWithoutPassword,
        role: user.role,
        showroomId: user.showroomId || null
      };
      
      setAuthState(newAuthState);
      console.log('Updated authState:', newAuthState);
      return true;
    }
    
    console.log('No user found with provided credentials');
    return false;
  };

  const logout = () => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      role: null,
      showroomId: null,
    }));
  };

  const hasPermission = (permission: string, context?: { toShowroomId?: string }): boolean => {
    if (!authState.user) {
      console.log(`No user authenticated for permission check: ${permission}`);
      return false;
    }

    const { role, showroomId } = authState.user;

    if (role === 'Super Admin') {
      console.log(`Permission '${permission}' granted for Super Admin`);
      return true;
    }

    const permissions = {
      'Showroom Admin': [
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
        'manage_users'
      ],
      'Employee': [
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

    // Allow Showroom Admin to approve/reject transfers targeting their showroom
    if (permission === 'manage_transfers' && role === 'Showroom Admin' && context?.toShowroomId) {
      const hasTransferPermission = context.toShowroomId === showroomId;
      console.log(`Checking permission '${permission}' for role '${role}' with toShowroomId '${context.toShowroomId}': ${hasTransferPermission}`);
      return hasTransferPermission;
    }

    const hasPerm = permissions[role]?.includes(permission) || false;
    console.log(`Checking permission '${permission}' for role '${role}': ${hasPerm}`);
    return hasPerm;
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, hasPermission, addUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { LocalStorageService, STORAGE_KEYS } from '../utils/localStorage';
// import { message } from 'antd';

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   password: string;
//   role: 'Super Admin' | 'Showroom Admin' | 'Employee';
//   showroomId?: string;
//   avatar?: string;
// }

// interface AuthState {
//   isAuthenticated: boolean;
//   user: Omit<User, 'password'> | null;
//   role: string | null;
//   showroomId: string | null;
//   users: User[];
// }

// interface AuthContextType {
//   authState: AuthState;
//   login: (credentials: { email: string; password: string }) => Promise<boolean>;
//   logout: () => void;
//   hasPermission: (permission: string) => boolean;
//   addUser: (user: Omit<User, 'id'>) => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const MOCK_USERS: User[] = [
//   {
//     id: '1',
//     name: 'Super Admin',
//     email: 'admin@agrierp.com',
//     password: 'admin123',
//     role: 'Super Admin',
//     avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
//   },
//   {
//     id: '2',
//     name: 'Mumbai Store Manager',
//     email: 'mumbai@agrierp.com',
//     password: 'mumbai123',
//     role: 'Showroom Admin',
//     showroomId: '1',
//     avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
//   },
//   {
//     id: '3',
//     name: 'Punjab Store Manager',
//     email: 'punjab@agrierp.com',
//     password: 'punjab123',
//     role: 'Showroom Admin',
//     showroomId: '2',
//     avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
//   },
//   {
//     id: '4',
//     name: 'Store Employee',
//     email: 'employee@agrierp.com',
//     password: 'emp123',
//     role: 'Employee',
//     showroomId: '1',
//     avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c96d?w=400'
//   }
// ];

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [authState, setAuthState] = useState<AuthState>(() => {
//     return LocalStorageService.get(STORAGE_KEYS.AUTH, {
//       isAuthenticated: false,
//       user: null,
//       role: null,
//       showroomId: null,
//       users: [],
//     });
//   });

//   useEffect(() => {
//     console.log('Saving authState to localStorage:', authState);
//     LocalStorageService.set(STORAGE_KEYS.AUTH, authState);
//   }, [authState]);

//   const addUser = (userData: Omit<User, 'id'>) => {
//     const newUser: User = {
//       ...userData,
//       id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
//     };
//     console.log('Adding new user:', newUser);
//     setAuthState(prev => {
//       const updatedUsers = [...(prev.users || []), newUser];
//       console.log('Updated authState.users:', updatedUsers);
//       return {
//         ...prev,
//         users: updatedUsers,
//       };
//     });
//     message.success('Showroom admin created successfully');
//   };

//   const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
//     console.log('Login attempt with credentials:', credentials);
//     console.log('MOCK_USERS:', MOCK_USERS);
//     console.log('authState.users:', authState.users);
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     const user = [
//       ...MOCK_USERS,
//       ...(authState.users || [])
//     ].find(u => u.email === credentials.email && u.password === credentials.password);

//     if (user) {
//       console.log('Found user:', user);
//       const { password, ...userWithoutPassword } = user;
//       const newAuthState = {
//         ...authState,
//         isAuthenticated: true,
//         user: userWithoutPassword,
//         role: user.role,
//         showroomId: user.showroomId || null
//       };
      
//       setAuthState(newAuthState);
//       console.log('Updated authState:', newAuthState);
//       return true;
//     }
    
//     console.log('No user found with provided credentials');
//     return false;
//   };

//   const logout = () => {
//     setAuthState(prev => ({
//       ...prev,
//       isAuthenticated: false,
//       user: null,
//       role: null,
//       showroomId: null,
//     }));
//   };

//   const hasPermission = (permission: string): boolean => {
//     if (!authState.user) return false;

//     const { role } = authState.user;

//     if (role === 'Super Admin') return true;

//  const permissions = {
//       'Showroom Admin': [
//         'view_dashboard',
//         'create_bill',
//         'view_bill_history',
//         'view_products',
//         'manage_products',
//         'add_stocks',
//         'view_transfers',
//         'request_transfers',
//         'view_orders',
//         'manage_orders',
//         'view_showrooms',
//         'view_employees',
//         'manage_employees',
//         'view_attendance',
//         'manage_attendance',
//         'view_salary',
//         'view_reports',
//         'add_customer',
//         'view_customers',
//         'edit_customer',
//         'download_bill_pdf',
//         'print_bill'
//       ],
//       'Employee': [
//         'view_dashboard',
//         'create_bill',
//         'view_bill_history',
//         'view_products',
//         'view_orders',
//         'view_attendance',
//         'mark_attendance',
//         'view_salary',
//         'view_profile',
//         'view_customers'
//       ]
//     };

//     return permissions[role]?.includes(permission) || false;
//   };

//   return (
//     <AuthContext.Provider value={{ authState, login, logout, hasPermission, addUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };
// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { LocalStorageService, STORAGE_KEYS } from '../utils/localStorage';
// import { message } from 'antd';

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: 'Super Admin' | 'Showroom Admin' | 'Employee';
//   showroomId?: string;
//   avatar?: string;
//   users: User[]; // ✅ Add this line
// }

// interface AuthState {
//   isAuthenticated: boolean;
//   user: User | null;
//   role: string | null;
//   showroomId: string | null;
// }

// interface AuthContextType {
//   authState: AuthState;
//   login: (credentials: { email: string; password: string }) => Promise<boolean>;
//   logout: () => void;
//   hasPermission: (permission: string) => boolean;
//   addUser: (user: Omit<User, 'id'>) => void; // Add addUser to interface
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Mock users for demo
// const MOCK_USERS = [
//   {
//     id: '1',
//     name: 'Super Admin',
//     email: 'admin@agrierp.com',
//     password: 'admin123',
//     role: 'Super Admin' as const,
//     avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'
//   },
//   {
//     id: '2',
//     name: 'Mumbai Store Manager',
//     email: 'mumbai@agrierp.com',
//     password: 'mumbai123',
//     role: 'Showroom Admin' as const,
//     showroomId: '1',
//     avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
//   },
//   {
//     id: '3',
//     name: 'Punjab Store Manager',
//     email: 'punjab@agrierp.com',
//     password: 'punjab123',
//     role: 'Showroom Admin' as const,
//     showroomId: '2',
//     avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'
//   },
//   {
//     id: '4',
//     name: 'Store Employee',
//     email: 'employee@agrierp.com',
//     password: 'emp123',
//     role: 'Employee' as const,
//     showroomId: '1',
//     avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c96d?w=400'
//   }
// ];

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [authState, setAuthState] = useState<AuthState>(() => {
//     return LocalStorageService.get(STORAGE_KEYS.AUTH, {
//       isAuthenticated: false,
//       user: null,
//       role: null,
//       showroomId: null,
//       users: MOCK_USERS, // Initialize with mock users
//     });
//   });

//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.AUTH, authState);
//   }, [authState]);

//   const addUser = (userData: Omit<User, 'id'>) => {
//     const newUser: User = {
//       ...userData,
//       id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
//     };
//     setAuthState(prev => ({
//       ...prev,
//       users: [...(prev.users || []), newUser],
//     }));
//     message.success('Showroom admin created successfully');
//   };
//   const login = async (credentials: { email: string; password: string }): Promise<boolean> => {
//     // Simulate API call delay
//     await new Promise(resolve => setTimeout(resolve, 500));
    
//     const user = MOCK_USERS.find(
//       u => u.email === credentials.email && u.password === credentials.password
//     );

//     if (user) {
//       const { password, ...userWithoutPassword } = user;
//       const newAuthState = {
//         isAuthenticated: true,
//         user: userWithoutPassword,
//         role: user.role,
//         showroomId: user.showroomId || null
//       };
      
//       setAuthState(newAuthState);
//       return true;
//     }
    
//     return false;
//   };

//   const logout = () => {
//     const newAuthState = {
//       isAuthenticated: false,
//       user: null,
//       role: null,
//       showroomId: null
//     };
//     setAuthState(newAuthState);
//   };

//   const hasPermission = (permission: string): boolean => {
//     if (!authState.user) return false;
    
//     const { role } = authState.user;
    
//     // Super Admin has all permissions
//     if (role === 'Super Admin') return true;
    
//     // Define permission matrix
//     const permissions = {
//       'Showroom Admin': [
//         'view_dashboard',
//         'view_products',
//         'manage_products',
//         'view_showrooms',
//         'manage_showrooms',
//         'view_orders',
//         'manage_orders',
//         'view_employees',
//         'manage_employees',
//         'view_attendance',
//         'manage_attendance',
//         'view_salary',
//         'manage_salary',
//         'view_transfers',
//         'request_transfers',
//         'view_reports',
//         'view_settings'
//       ],
//       'Employee': [
//         'view_dashboard',
//         'view_products',
//         'view_orders',
//         'view_attendance',
//         'mark_attendance',
//         'view_salary',
//         'view_profile'
//       ]
//     };
    
//     return permissions[role]?.includes(permission) || false;
//   };

//   return (
//     <AuthContext.Provider value={{
//       authState,
//       login,
//       logout,
//       hasPermission,
//       addUser
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };