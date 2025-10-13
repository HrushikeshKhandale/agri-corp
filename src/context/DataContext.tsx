import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { useAuth } from './AuthContexts';
import productService from '../services/productService';
import showroomService from '../services/showroomService';
import customerService from '../services/customerService';
import billService from '../services/billService';
import { Bill } from '../services/types/bill';

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  village: string;
  taluka: string;
  district: string;
}

export interface Product {
  id?: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  gst: number;
  stock: number;
  imageUrl: string;
  description: string;
  companyName: string;
  type: string;
  subtype: string;
  inwardPrice: number;
  discount: number;
  showroom?: {
    id: number;
  };
}

export interface Showroom {
  id: number;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  adminEmail: string | null;
  adminPassword: string | null;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  showroomId: string;
  salary: number;
  phone: string;
  email: string;
  avatar?: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI';
  advanceTaken: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  village?: string;
  taluka?: string;
  district?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    price: number;
    gst: number;
    discount?: number;
    discountType?: 'percent' | 'amount';
    totalAmount?: number;
  }>;
  subtotal: number;
  totalGst: number;
  total: number;
  paidAmount?: number;
  unpaidAmount?: number;
  status: string;
  showroomId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Transfer {
  id: string;
  productId: string;
  productName: string;
  fromShowroomId: string;
  toShowroomId: string;
  quantity: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  createdAt: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  advanceTaken: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: 'Pending' | 'Paid';
  paidAt?: string;
  createdAt: string;
}

export interface StockStore {
  id: string;
  productId: string;
  showroomId: string;
  quantity: number;
  inwardDate: string;
  companyId: string;
  category: string;
  type: string;
  subtype: string;
  unit: string;
  inwardPrice: number;
  salePrice: number;
  gst: number;
  discount: number;
  qty: number;
  totalAmount: number;
  availableStock: number;
  barcode: string;
  rack: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt?: string;
}

interface DataContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (id: number, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  fetchCustomers: () => Promise<void>;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  fetchProducts: () => Promise<void>;
  showrooms: Showroom[];
  addShowroom: (showroomData: Omit<Showroom, 'id'>) => Promise<void>;
  updateShowroom: (id: number, showroomData: Partial<Showroom>) => Promise<void>;
  deleteShowroom: (id: number) => Promise<void>;
  fetchShowrooms: () => Promise<void>;
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, employee: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  transfers: Transfer[];
  addTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt'>) => void;
  updateTransfer: (id: string, transfer: Partial<Transfer>) => void;
  approveTransfer: (id: string, approvedBy: string) => void;
  rejectTransfer: (id: string, rejectedBy: string) => void;
  attendance: AttendanceRecord[];
  markAttendance: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  updateAttendance: (id: string, record: Partial<AttendanceRecord>) => void;
  salaryRecords: SalaryRecord[];
  addSalaryRecord: (record: Omit<SalaryRecord, 'id' | 'createdAt'>) => void;
  updateSalaryRecord: (id: string, record: Partial<SalaryRecord>) => void;
  updateStock: (productId: string, showroomId: string, quantity: number) => void;
  transferStock: (productId: string, fromShowroom: string, toShowroom: string, quantity: number) => void;
  generateOrderNumber: () => string;
  getProductsByShowroom: (showroomId: string) => Array<Product & { availableStock: number }>;
  getTotalStockValue: (showroomId?: string) => number;
  calculateOrderTotal: (items: Order['items']) => { subtotal: number; totalGst: number; total: number };
  createBill: (billData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Order;
  bills: Bill[];
  addBill: (billData: Omit<Bill, 'id'>) => Promise<void>;
  updateBill: (id: number, billData: Omit<Bill, 'id'>) => Promise<void>;
  fetchBills: () => Promise<void>;
  getCustomerBalance: (customerId: string) => { totalPaid: number; totalUnpaid: number };
  stockStores: StockStore[];
  addStockStore: (stock: Omit<StockStore, 'id' | 'createdAt'>) => StockStore;
  updateStockStore: (id: string, stock: Partial<StockStore>) => void;
  deleteStockStore: (id: string) => void;
  companies: Company[];
  addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Company;
  updateCompany: (id: string, company: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showrooms, setShowrooms] = useState<Showroom[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [stockStores, setStockStores] = useState<StockStore[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const { isAuthenticated } = useAuth();

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     fetchProducts();
  //     fetchShowrooms();
  //     fetchCustomers();
  //     fetchBills();
  //   }
  // }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    }
  };

  const fetchShowrooms = async () => {
    try {
      const data = await showroomService.getAllShowrooms();
      setShowrooms(data);
    } catch (error) {
      message.error('Failed to fetch showrooms');
      console.error('Error fetching showrooms:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      message.error('Failed to fetch customers');
      console.error('Error fetching customers:', error);
    }
  };

  const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
    try {
      await customerService.createCustomer(customerData);
      await fetchCustomers();
      message.success('Customer added successfully');
    } catch (error) {
      message.error('Failed to add customer');
      console.error('Error adding customer:', error);
    }
  };

  const updateCustomer = async (id: number, customerData: Partial<Customer>) => {
    try {
      await customerService.updateCustomer(id, customerData);
      await fetchCustomers();
      message.success('Customer updated successfully');
    } catch (error) {
      message.error('Failed to update customer');
      console.error('Error updating customer:', error);
    }
  };

  const deleteCustomer = async (id: number) => {
    try {
      await customerService.deleteCustomer(id);
      await fetchCustomers();
      message.success('Customer deleted successfully');
    } catch (error) {
      message.error('Failed to delete customer');
      console.error('Error deleting customer:', error);
    }
  };

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      await productService.createProduct(productData);
      await fetchProducts();
      message.success('Product added successfully');
    } catch (error) {
      message.error('Failed to add product');
      console.error('Error adding product:', error);
    }
  };

  const updateProduct = async (id: number, productData: Partial<Product>) => {
    try {
      await productService.updateProduct(id, productData);
      await fetchProducts();
      message.success('Product updated successfully');
    } catch (error) {
      message.error('Failed to update product');
      console.error('Error updating product:', error);
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      await productService.deleteProduct(id);
      await fetchProducts();
      message.success('Product deleted successfully');
    } catch (error) {
      message.error('Failed to delete product');
      console.error('Error deleting product:', error);
    }
  };

  const addShowroom = async (showroomData: Omit<Showroom, 'id'>) => {
    try {
      await showroomService.createShowroom(showroomData);
      await fetchShowrooms();
      message.success('Showroom added successfully');
    } catch (error) {
      message.error('Failed to add showroom');
      console.error('Error adding showroom:', error);
    }
  };

  const updateShowroom = async (id: number, showroomData: Partial<Showroom>) => {
    try {
      await showroomService.updateShowroom(id, showroomData);
      await fetchShowrooms();
      message.success('Showroom updated successfully');
    } catch (error) {
      message.error('Failed to update showroom');
      console.error('Error updating showroom:', error);
    }
  };

  const deleteShowroom = async (id: number) => {
    try {
      await showroomService.deleteShowroom(id);
      await fetchShowrooms();
      message.success('Showroom deleted successfully');
    } catch (error) {
      message.error('Failed to delete showroom');
      console.error('Error deleting showroom:', error);
    }
  };

  // Placeholder functions for other entities (keeping existing logic for now)
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = (orders.length + 1).toString().padStart(4, '0');
    return `AG${year}${month}${day}${sequence}`;
  };

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setEmployees(prev => [...prev, newEmployee]);
    message.success('Employee added successfully');
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(employee =>
        employee.id === id ? { ...employee, ...employeeData, updatedAt: new Date().toISOString() } : employee
      )
    );
    message.success('Employee updated successfully');
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id));
    message.success('Employee deleted successfully');
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const { subtotal, totalGst, total } = calculateOrderTotal(orderData.items);
    const newOrder: Order = {
      ...orderData,
      id: generateId(),
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      subtotal,
      totalGst,
      total,
      paidAmount: orderData.paidAmount || 0,
      unpaidAmount: orderData.paidAmount ? total - orderData.paidAmount : total
    };
    setOrders(prev => [...prev, newOrder]);
    message.success('Order created successfully');
  };

  const updateOrder = (id: string, orderData: Partial<Order>) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === id
          ? {
              ...order,
              ...orderData,
              updatedAt: new Date().toISOString(),
              ...(orderData.items ? calculateOrderTotal(orderData.items) : {})
            }
          : order
      )
    );
    message.success('Order updated successfully');
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
    message.success('Order deleted successfully');
  };

  const createBill = (billData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const { subtotal, totalGst, total } = calculateOrderTotal(billData.items);
    const newBill: Order = {
      ...billData,
      id: generateId(),
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      subtotal,
      totalGst,
      total,
      paidAmount: billData.paidAmount || 0,
      unpaidAmount: billData.paidAmount ? total - billData.paidAmount : total,
    };
    setOrders(prev => [...prev, newBill]);
    message.success('Bill created successfully');
    return newBill;
  };

  const addTransfer = (transferData: Omit<Transfer, 'id' | 'createdAt'>) => {
    const newTransfer: Transfer = {
      ...transferData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setTransfers(prev => [...prev, newTransfer]);
    message.success('Transfer request created successfully');
  };

  const updateTransfer = (id: string, transferData: Partial<Transfer>) => {
    setTransfers(prev =>
      prev.map(transfer =>
        transfer.id === id ? { ...transfer, ...transferData, updatedAt: new Date().toISOString() } : transfer
      )
    );
    message.success('Transfer updated successfully');
  };

  const approveTransfer = (id: string, approvedBy: string) => {
    updateTransfer(id, {
      status: 'Approved',
      approvedBy,
      updatedAt: new Date().toISOString()
    });
    message.success('Transfer approved successfully');
  };

  const rejectTransfer = (id: string, rejectedBy: string) => {
    updateTransfer(id, {
      status: 'Rejected',
      approvedBy: rejectedBy,
      updatedAt: new Date().toISOString()
    });
    message.info('Transfer request rejected');
  };

  const markAttendance = (recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setAttendance(prev => [...prev, newRecord]);
    message.success('Attendance marked successfully');
  };

  const updateAttendance = (id: string, recordData: Partial<AttendanceRecord>) => {
    setAttendance(prev =>
      prev.map(record => (record.id === id ? { ...record, ...recordData } : record))
    );
    message.success('Attendance updated successfully');
  };

  const addSalaryRecord = (recordData: Omit<SalaryRecord, 'id' | 'createdAt'>) => {
    const newRecord: SalaryRecord = {
      ...recordData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setSalaryRecords(prev => [...prev, newRecord]);
    message.success('Salary record created successfully');
  };

  const updateSalaryRecord = (id: string, recordData: Partial<SalaryRecord>) => {
    setSalaryRecords(prev =>
      prev.map(record => (record.id === id ? { ...record, ...recordData } : record))
    );
    message.success('Salary record updated successfully');
  };

  const updateStock = (productId: string, showroomId: string, quantity: number) => {
    message.success('Stock updated successfully');
  };

  const transferStock = (productId: string, fromShowroom: string, toShowroom: string, quantity: number) => {
    message.success('Stock transferred successfully');
  };

  const getProductsByShowroom = (showroomId: string) => {
    return products.map(product => ({
      ...product,
      availableStock: product.stock || 0
    }));
  };

  const getTotalStockValue = (showroomId?: string) => {
    return products.reduce((total, product) => {
      const stock = product.stock || 0;
      return total + stock * product.price;
    }, 0);
  };

  const calculateOrderTotal = (items: Order['items']) => {
    return items.reduce(
      (acc, item) => {
        const discount = item.discount || 0;
        let priceAfterDiscount: number;
        if (item.discountType === 'amount') {
          priceAfterDiscount = item.price - discount;
        } else {
          priceAfterDiscount = item.price * (1 - discount / 100);
        }
        const itemSubtotal = priceAfterDiscount * item.quantity;
        const itemGst = (priceAfterDiscount * item.gst * item.quantity) / 100;
        return {
          subtotal: acc.subtotal + itemSubtotal,
          totalGst: acc.totalGst + itemGst,
          total: acc.total + itemSubtotal + itemGst,
        };
      },
      { subtotal: 0, totalGst: 0, total: 0 }
    );
  };

  const addStockStore = (stockData: Omit<StockStore, 'id' | 'createdAt'>) => {
    const newStockStore: StockStore = {
      ...stockData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      availableStock: stockData.quantity,
      totalAmount: stockData.qty * stockData.salePrice
    };
    setStockStores(prev => [...prev, newStockStore]);
    message.success('Stock added successfully');
    return newStockStore;
  };

  const updateStockStore = (id: string, stockData: Partial<StockStore>) => {
    setStockStores(prev =>
      prev.map(stock =>
        stock.id === id ? { ...stock, ...stockData } : stock
      )
    );
    message.success('Stock record updated successfully');
  };

  const deleteStockStore = (id: string) => {
    setStockStores(prev => prev.filter(stock => stock.id !== id));
    message.success('Stock deleted successfully');
  };

  const addCompany = (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: Company = {
      ...companyData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setCompanies(prev => [...prev, newCompany]);
    message.success('Company added successfully');
    return newCompany;
  };

  const updateCompany = (id: string, companyData: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(company =>
        company.id === id ? { ...company, ...companyData, updatedAt: new Date().toISOString() } : company
      )
    );
    message.success('Company updated successfully');
  };

  const deleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(company => company.id !== id));
    message.success('Company deleted successfully');
  };

  const fetchBills = async () => {
    try {
      const data = await billService.getAllBills();
      setBills(data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const addBill = async (billData: Omit<Bill, 'id'>) => {
    try {
      await billService.createBill(billData);
      await fetchBills();
      message.success('Bill created successfully');
    } catch (error) {
      message.error('Failed to create bill');
      console.error('Error creating bill:', error);
    }
  };

  const updateBill = async (id: number, billData: Omit<Bill, 'id'>) => {
    try {
      await billService.updateBill(id, billData);
      await fetchBills();
      message.success('Bill updated successfully');
    } catch (error) {
      message.error('Failed to update bill');
      console.error('Error updating bill:', error);
    }
  };

  const getCustomerBalance = (customerId: string) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const totalPaid = customerOrders.reduce((sum, order) => sum + (order.paidAmount || 0), 0);
    const totalUnpaid = customerOrders.reduce((sum, order) => sum + (order.unpaidAmount || 0), 0);
    return { totalPaid, totalUnpaid };
  };

  const value: DataContextType = {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    fetchCustomers,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    fetchProducts,
    showrooms,
    addShowroom,
    updateShowroom,
    deleteShowroom,
    fetchShowrooms,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    transfers,
    addTransfer,
    updateTransfer,
    approveTransfer,
    rejectTransfer,
    attendance,
    markAttendance,
    updateAttendance,
    salaryRecords,
    addSalaryRecord,
    updateSalaryRecord,
    updateStock,
    transferStock,
    generateOrderNumber,
    getProductsByShowroom,
    getTotalStockValue,
    calculateOrderTotal,
    createBill,
    stockStores,
    addStockStore,
    updateStockStore,
    deleteStockStore,
    companies,
    addCompany,
    updateCompany,
    deleteCompany,
    bills,
    addBill,
    updateBill,
    fetchBills,
    getCustomerBalance,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};