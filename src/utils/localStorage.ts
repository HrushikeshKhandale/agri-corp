// Local Storage utilities for agriculture ERP system

export const STORAGE_KEYS = {
  CUSTOMERS: 'customers',
  PRODUCTS: 'ag_products',
  SHOWROOMS: 'ag_showrooms',
  ORDERS: 'ag_orders',
  EMPLOYEES: 'ag_employees',
  ATTENDANCE: 'ag_attendance',
  SALARY_RECORDS: 'ag_salary_records',
  TRANSFERS: 'ag_transfers',
  SETTINGS: 'ag_settings',
  AUTH: 'ag_auth'
} as const;

export class LocalStorageService {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to read localStorage key: ${key.replace(/[^a-zA-Z0-9_]/g, '_')}`);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write localStorage key: ${key.replace(/[^a-zA-Z0-9_]/g, '_')}`);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove localStorage key: ${key.replace(/[^a-zA-Z0-9_]/g, '_')}`);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}
if (!LocalStorageService.get(STORAGE_KEYS.CUSTOMERS, null)) {
    LocalStorageService.set(STORAGE_KEYS.CUSTOMERS, []);
  }

// Initialize default data if not exists
export const initializeDefaultData = () => {
  // Default showrooms
  if (!localStorage.getItem(STORAGE_KEYS.SHOWROOMS)) {
    const defaultShowrooms = [
      {
        id: '1',
        name: 'Central Agriculture Store',
        location: 'Mumbai, Maharashtra',
        contactPerson: 'Rajesh Kumar',
        phone: '+91 9876543210',
        email: 'rajesh@centralagri.com',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Punjab Farming Hub',
        location: 'Ludhiana, Punjab',
        contactPerson: 'Gurpreet Singh',
        phone: '+91 9876543211',
        email: 'gurpreet@punjabfarm.com',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Tamil Nadu Seeds Center',
        location: 'Chennai, Tamil Nadu',
        contactPerson: 'Murugan Krishnan',
        phone: '+91 9876543212',
        email: 'murugan@tnseeds.com',
        createdAt: new Date().toISOString()
      }
    ];
    LocalStorageService.set(STORAGE_KEYS.SHOWROOMS, defaultShowrooms);
  }

  // Default products
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    const defaultProducts = [
      {
        id: '1',
        name: 'Basmati Rice Seeds',
        category: 'Seeds',
        unit: 'kg',
        price: 120,
        gst: 5,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
        description: 'Premium quality basmati rice seeds for high yield',
        stock: {
          '1': 500,
          '2': 750,
          '3': 300
        },
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'NPK Fertilizer',
        category: 'Fertilizer',
        unit: 'kg',
        price: 35,
        gst: 12,
        image: 'https://images.unsplash.com/photo-1574423481519-d3cc00b6ed85?w=400',
        description: 'Balanced NPK fertilizer for all crops',
        stock: {
          '1': 1000,
          '2': 800,
          '3': 600
        },
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Organic Pesticide',
        category: 'Pesticide',
        unit: 'liters',
        price: 280,
        gst: 18,
        image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400',
        description: 'Eco-friendly organic pesticide solution',
        stock: {
          '1': 200,
          '2': 150,
          '3': 100
        },
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Tractor Plow',
        category: 'Equipment',
        unit: 'piece',
        price: 25000,
        gst: 28,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        description: 'Heavy-duty tractor plow for deep cultivation',
        stock: {
          '1': 5,
          '2': 3,
          '3': 2
        },
        createdAt: new Date().toISOString()
      }
    ];
    LocalStorageService.set(STORAGE_KEYS.PRODUCTS, defaultProducts);
  }

  // Default employees
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    const defaultEmployees = [
      {
        id: '1',
        name: 'Amit Sharma',
        role: 'Store Manager',
        showroomId: '1',
        salary: 45000,
        phone: '+91 9876543213',
        email: 'amit.sharma@email.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        paymentMethod: 'Bank Transfer',
        advanceTaken: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Priya Patel',
        role: 'Sales Executive',
        showroomId: '1',
        salary: 35000,
        phone: '+91 9876543214',
        email: 'priya.patel@email.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c96d?w=400',
        paymentMethod: 'Cash',
        advanceTaken: 5000,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Suresh Kumar',
        role: 'Inventory Manager',
        showroomId: '2',
        salary: 40000,
        phone: '+91 9876543215',
        email: 'suresh.kumar@email.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        paymentMethod: 'Bank Transfer',
        advanceTaken: 10000,
        createdAt: new Date().toISOString()
      }
    ];
    LocalStorageService.set(STORAGE_KEYS.EMPLOYEES, defaultEmployees);
  }

  // Default settings
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    const defaultSettings = {
      appTitle: 'AgriCorp',
      companyName: 'Green Fields Agriculture',
      gstNumber: '22AAAAA0000A1Z5',
      address: '123 Agriculture Hub, Farm City, State - 123456',
      defaultGst: 12,
      currency: 'INR',
      theme: 'light',
      notifications: {
        email: true,
        sms: true,
        whatsapp: true
      }
    };
    LocalStorageService.set(STORAGE_KEYS.SETTINGS, defaultSettings);
  }

  // Initialize auth if not exists
  if (!localStorage.getItem(STORAGE_KEYS.AUTH)) {
    const defaultAuth = {
      isAuthenticated: false,
      user: null,
      role: null,
      showroomId: null
    };
    LocalStorageService.set(STORAGE_KEYS.AUTH, defaultAuth);
  }
};