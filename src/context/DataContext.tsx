import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LocalStorageService, STORAGE_KEYS, initializeDefaultData } from '../utils/localStorage';
import { message } from 'antd';
import { useAuth } from './AuthContext';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  village?: string;
  taluka?: string;
  district?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'Seeds' | 'Fertilizer' | 'Pesticide' | 'Equipment';
  unit: string;
  price: number;
  gst: number;
  image?: string;
  description?: string;
  stock: Record<string, number>;
  createdAt: string;
  updatedAt?: string;
  companyName?: string;
  type?: string;
  subtype?: string;
  inwardPrice?: number;
  discount?: number;
}

export interface Showroom {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
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
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerBalance: (customerId: string) => { totalPaid: number; totalUnpaid: number };
  products: Product[];
  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    showroomId: string
  ) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  showrooms: Showroom[];
  addShowroom: (showroomData: Omit<Showroom, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateShowroom: (id: string, showroomData: Partial<Showroom>) => void;
  deleteShowroom: (id: string) => void;
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
  const { hasPermission } = useAuth();
  useEffect(() => {
    initializeDefaultData();
  }, []);

  const [customers, setCustomers] = useState<Customer[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.CUSTOMERS, [])
  );
  const [products, setProducts] = useState<Product[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.PRODUCTS, [])
  );
  const [showrooms, setShowrooms] = useState<Showroom[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.SHOWROOMS, [])
  );
  const [employees, setEmployees] = useState<Employee[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.EMPLOYEES, [])
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.ORDERS, [])
  );
  const [transfers, setTransfers] = useState<Transfer[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.TRANSFERS, [])
  );
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.ATTENDANCE, [])
  );
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(() =>
    LocalStorageService.get(STORAGE_KEYS.SALARY_RECORDS, [])
  );
 const [stockStores, setStockStores] = useState<StockStore[]>(() =>
    LocalStorageService.get('ag_stock_stores', [])
  );
  const [companies, setCompanies] = useState<Company[]>(() =>
    LocalStorageService.get('ag_companies', [])
  );

  
  // Sync products.stock with stockStores
  const syncProductStockWithStockStores = () => {
    const stockMap: Record<string, Record<string, number>> = {};
    stockStores.forEach(stock => {
      const productId = stock.productId;
      const showroomId = stock.showroomId;
      if (!stockMap[productId]) stockMap[productId] = {};
      stockMap[productId][showroomId] = (stockMap[productId][showroomId] || 0) + stock.availableStock;
    });

    setProducts(prev =>
      prev.map(product => ({
        ...product,
        stock: stockMap[product.id] || product.stock || {},
        updatedAt: new Date().toISOString()
      }))
    );
    console.log('Synchronized products.stock with stockStores');
  };


  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);
  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);
  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.SHOWROOMS, showrooms);
  }, [showrooms]);
  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.EMPLOYEES, employees);
  }, [employees]);
  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.ORDERS, orders);
  }, [orders]);
  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.TRANSFERS, transfers);
  }, [transfers]);
  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.ATTENDANCE, attendance);
  }, [attendance]);
  useEffect(() => {
    LocalStorageService.set(STORAGE_KEYS.SALARY_RECORDS, salaryRecords);
  }, [salaryRecords]);
 useEffect(() => {
    LocalStorageService.set('ag_stock_stores', stockStores);
    syncProductStockWithStockStores();
  }, [stockStores]);
  useEffect(() => {
    LocalStorageService.set('ag_companies', companies);
  }, [companies]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const sequence = (orders.length + 1).toString().padStart(4, '0');
    return `AG${year}${month}${day}${sequence}`;
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setCustomers(prev => [...prev, newCustomer]);
    message.success('Customer added successfully');
    console.log(`Added customer ${newCustomer.id}:`, newCustomer);
    return newCustomer;
  };

  const updateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === id ? { ...customer, ...customerData, updatedAt: new Date().toISOString() } : customer
      )
    );
    message.success('Customer updated successfully');
    console.log(`Updated customer ${id}:`, customerData);
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
    message.success('Customer deleted successfully');
    console.log(`Deleted customer ${id}`);
  };

  const getCustomerBalance = (customerId: string) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    return customerOrders.reduce(
      (acc, order) => ({
        totalPaid: acc.totalPaid + (order.paidAmount || 0),
        totalUnpaid: acc.totalUnpaid + (order.unpaidAmount || 0)
      }),
      { totalPaid: 0, totalUnpaid: 0 }
    );
  };

  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    showroomId: string
  ) => {
    const newProduct: Product = {
      ...productData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      inwardPrice: productData.inwardPrice || productData.price * 0.8,
      discount: productData.discount || 0,
      stock: { [showroomId]: productData.stock[showroomId] || 0 }
    };
    setProducts(prev => [...prev, newProduct]);
    message.success('Product added successfully');
    console.log(`Added product ${newProduct.id} for showroom ${showroomId}:`, newProduct);
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id ? { ...product, ...productData, updatedAt: new Date().toISOString() } : product
      )
    );
    message.success('Product updated successfully');
    console.log(`Updated product ${id}:`, productData);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
    message.success('Product deleted successfully');
    console.log(`Deleted product ${id}`);
  };

  const addShowroom = (showroomData: Omit<Showroom, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newShowroom: Showroom = {
      ...showroomData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setShowrooms(prev => [...prev, newShowroom]);
    message.success('Showroom added successfully');
    console.log(`Added showroom ${newShowroom.id}:`, newShowroom);
    return newShowroom.id;
  };

  const updateShowroom = (id: string, showroomData: Partial<Showroom>) => {
    setShowrooms(prev =>
      prev.map(showroom =>
        showroom.id === id ? { ...showroom, ...showroomData, updatedAt: new Date().toISOString() } : showroom
      )
    );
    message.success('Showroom updated successfully');
    console.log(`Updated showroom ${id}:`, showroomData);
  };

  const deleteShowroom = (id: string) => {
    setShowrooms(prev => prev.filter(showroom => showroom.id !== id));
    message.success('Showroom deleted successfully');
    console.log(`Deleted showroom ${id}`);
  };

  const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setEmployees(prev => [...prev, newEmployee]);
    message.success('Employee added successfully');
    console.log(`Added employee ${newEmployee.id}:`, newEmployee);
  };

  const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(employee =>
        employee.id === id ? { ...employee, ...employeeData, updatedAt: new Date().toISOString() } : employee
      )
    );
    message.success('Employee updated successfully');
    console.log(`Updated employee ${id}:`, employeeData);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(employee => employee.id !== id));
    message.success('Employee deleted successfully');
    console.log(`Deleted employee ${id}`);
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    const { subtotal, totalGst, total } = calculateOrderTotal(orderData.items);
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      const stock = product?.stock[orderData.showroomId] || 0;
      if (stock < item.quantity) {
        message.error(`Insufficient stock for ${item.productName} in showroom`);
        console.log(`Insufficient stock for order: product ${item.productId}, requested ${item.quantity}, available ${stock}`);
        return;
      }
    }
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
    orderData.items.forEach(item => {
      updateStock(
        item.productId,
        orderData.showroomId,
        (products.find(p => p.id === item.productId)?.stock[orderData.showroomId] || 0) - item.quantity
      );
    });
    message.success('Order created successfully');
    console.log(`Added order ${newOrder.id}:`, newOrder);
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
    console.log(`Updated order ${id}:`, orderData);
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
    message.success('Order deleted successfully');
    console.log(`Deleted order ${id}`);
  };

  const createBill = (billData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
    for (const item of billData.items) {
      const product = products.find(p => p.id === item.productId);
      const stock = product?.stock[billData.showroomId] || 0;
      if (!product || stock < item.quantity) {
        message.error(`Insufficient stock for ${item.productName} in showroom`);
        console.log(`Insufficient stock for bill: product ${item.productId}, requested ${item.quantity}, available ${stock}`);
        throw new Error(`Insufficient stock for ${item.productName}`);
      }
    }
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
    billData.items.forEach(item => {
      updateStock(
        item.productId,
        billData.showroomId,
        (products.find(p => p.id === item.productId)?.stock[billData.showroomId] || 0) - item.quantity
      );
    });
    message.success('Bill created successfully');
    console.log(`Created bill ${newBill.id}:`, newBill);
    return newBill;
  };

  const addTransfer = (transferData: Omit<Transfer, 'id' | 'createdAt'>) => {
    const product = products.find(p => p.id === transferData.productId);
    const stock = product?.stock[transferData.fromShowroomId] || 0;
    if (!product || stock < transferData.quantity) {
      message.error(`Insufficient stock for ${transferData.productName} in source showroom`);
      console.log(`Insufficient stock for transfer: product ${transferData.productId}, requested ${transferData.quantity}, available ${stock}`);
      return;
    }
    if (transferData.fromShowroomId === transferData.toShowroomId) {
      message.error('Source and destination showrooms cannot be the same');
      console.log(`Invalid transfer: fromShowroomId ${transferData.fromShowroomId} equals toShowroomId ${transferData.toShowroomId}`);
      return;
    }
    const newTransfer: Transfer = {
      ...transferData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setTransfers(prev => [...prev, newTransfer]);
    message.success('Transfer request created successfully');
    console.log(`Added transfer ${newTransfer.id}:`, newTransfer);
  };

  const updateTransfer = (id: string, transferData: Partial<Transfer>) => {
    setTransfers(prev =>
      prev.map(transfer =>
        transfer.id === id ? { ...transfer, ...transferData, updatedAt: new Date().toISOString() } : transfer
      )
    );
    message.success('Transfer updated successfully');
    console.log(`Updated transfer ${id}:`, transferData);
  };

  const approveTransfer = (id: string, approvedBy: string) => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) {
      message.error('Transfer not found');
      console.log(`Transfer ${id} not found`);
      return;
    }
    if (!hasPermission('manage_transfers', { toShowroomId: transfer.toShowroomId })) {
      message.error('You do not have permission to approve this transfer');
      console.log(`Permission check failed: manage_transfers for transfer ${id} with toShowroomId ${transfer.toShowroomId}`);
      return;
    }
    const product = products.find(p => p.id === transfer.productId);
    if (!product || (product.stock[transfer.fromShowroomId] || 0) < transfer.quantity) {
      message.error('Insufficient stock for transfer');
      console.log(`Insufficient stock for transfer ${id}: product ${transfer.productId}, requested ${transfer.quantity}, available ${product?.stock[transfer.fromShowroomId] || 0}`);
      return;
    }
    transferStock(transfer.productId, transfer.fromShowroomId, transfer.toShowroomId, transfer.quantity);
    // Create StockStore entry for destination showroom
    const sourceStockStore = stockStores.find(s => 
      s.productId === transfer.productId && s.showroomId === transfer.fromShowroomId
    );
    if (sourceStockStore) {
      const newStockStore: StockStore = {
        ...sourceStockStore,
        id: generateId(),
        showroomId: transfer.toShowroomId,
        quantity: transfer.quantity,
        availableStock: transfer.quantity,
        totalAmount: transfer.quantity * sourceStockStore.salePrice,
        createdAt: new Date().toISOString()
      };
      setStockStores(prev => [...prev, newStockStore]);
      console.log(`Added StockStore ${newStockStore.id} for transfer ${id} to showroom ${transfer.toShowroomId}:`, newStockStore);
      // Update source StockStore
      setStockStores(prev =>
        prev.map(stock =>
          stock.id === sourceStockStore.id
            ? { ...stock, quantity: stock.quantity - transfer.quantity, availableStock: stock.availableStock - transfer.quantity }
            : stock
        )
      );
      console.log(`Updated source StockStore ${sourceStockStore.id} for transfer ${id}: quantity ${sourceStockStore.quantity - transfer.quantity}`);
    }
    updateTransfer(id, {
      status: 'Approved',
      approvedBy,
      updatedAt: new Date().toISOString()
    });
    message.success('Transfer approved and executed successfully');
  };

  const rejectTransfer = (id: string, rejectedBy: string) => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) {
      message.error('Transfer not found');
      console.log(`Transfer ${id} not found`);
      return;
    }
    if (!hasPermission('manage_transfers', { toShowroomId: transfer.toShowroomId })) {
      message.error('You do not have permission to reject this transfer');
      console.log(`Permission check failed: manage_transfers for transfer ${id} with toShowroomId ${transfer.toShowroomId}`);
      return;
    }
    updateTransfer(id, {
      status: 'Rejected',
      approvedBy: rejectedBy,
      updatedAt: new Date().toISOString()
    });
    message.info('Transfer request rejected');
    console.log(`Rejected transfer ${id} by ${rejectedBy}`);
  };

  const markAttendance = (recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
    const newRecord: AttendanceRecord = {
      ...recordData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setAttendance(prev => [...prev, newRecord]);
    message.success('Attendance marked successfully');
    console.log(`Marked attendance ${newRecord.id}:`, newRecord);
  };

  const updateAttendance = (id: string, recordData: Partial<AttendanceRecord>) => {
    setAttendance(prev =>
      prev.map(record => (record.id === id ? { ...record, ...recordData } : record))
    );
    message.success('Attendance updated successfully');
    console.log(`Updated attendance ${id}:`, recordData);
  };

  const addSalaryRecord = (recordData: Omit<SalaryRecord, 'id' | 'createdAt'>) => {
    const newRecord: SalaryRecord = {
      ...recordData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setSalaryRecords(prev => [...prev, newRecord]);
    message.success('Salary record created successfully');
    console.log(`Added salary record ${newRecord.id}:`, newRecord);
  };

  const updateSalaryRecord = (id: string, recordData: Partial<SalaryRecord>) => {
    setSalaryRecords(prev =>
      prev.map(record => (record.id === id ? { ...record, ...recordData } : record))
    );
    message.success('Salary record updated successfully');
    console.log(`Updated salary record ${id}:`, recordData);
  };

  const updateStock = (productId: string, showroomId: string, quantity: number) => {
    if (quantity < 0) {
      message.error('Stock quantity cannot be negative');
      console.log(`Invalid stock update: product ${productId}, showroom ${showroomId}, quantity ${quantity}`);
      return;
    }
    setProducts(prev =>
      prev.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            stock: {
              ...product.stock,
              [showroomId]: quantity
            },
            updatedAt: new Date().toISOString()
          };
        }
        return product;
      })
    );
    message.success('Stock updated successfully');
    console.log(`Updated stock for product ${productId} in showroom ${showroomId}: ${quantity}`);
  };

  const transferStock = (productId: string, fromShowroom: string, toShowroom: string, quantity: number) => {
    if (fromShowroom === toShowroom) {
      message.error('Source and destination showrooms cannot be the same');
      console.log(`Invalid stock transfer: product ${productId}, from ${fromShowroom} to ${toShowroom}`);
      return;
    }
    setProducts(prev =>
      prev.map(product => {
        if (product.id === productId) {
          const fromStock = product.stock[fromShowroom] || 0;
          const toStock = product.stock[toShowroom] || 0;
          if (fromStock >= quantity) {
            return {
              ...product,
              stock: {
                ...product.stock,
                [fromShowroom]: fromStock - quantity,
                [toShowroom]: toStock + quantity
              },
              updatedAt: new Date().toISOString()
            };
          } else {
            message.error('Insufficient stock for transfer');
            console.log(`Insufficient stock for transfer: product ${productId}, requested ${quantity}, available ${fromStock}`);
            return product;
          }
        }
        return product;
      })
    );
    console.log(`Transferred ${quantity} units of product ${productId} from showroom ${fromShowroom} to ${toShowroom}`);
  };

  const getProductsByShowroom = (showroomId: string) => {
    return products.map(product => ({
      ...product,
      availableStock: product.stock[showroomId] || 0
    }));
  };

  const getTotalStockValue = (showroomId?: string) => {
    return products.reduce((total, product) => {
      if (showroomId) {
        const stock = product.stock[showroomId] || 0;
        return total + stock * product.price;
      }
      const totalStock = Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
      return total + totalStock * product.price;
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
    const company = companies.find(c => c.name === stockData.companyId);
    if (!company) {
      message.error('Company does not exist');
      console.log(`Invalid company for stock store: ${stockData.companyId}`);
      return;
    }
    const newStockStore: StockStore = {
      ...stockData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      companyId: company.id,
      availableStock: stockData.quantity,
      totalAmount: stockData.qty * stockData.salePrice
    };
    setStockStores(prev => [...prev, newStockStore]);
    updateStock(stockData.productId, stockData.showroomId, (products.find(p => p.id === stockData.productId)?.stock[stockData.showroomId] || 0) + stockData.quantity);
    message.success('Stock added successfully');
    console.log(`Added StockStore ${newStockStore.id}:`, newStockStore);
    return newStockStore;
  };

  const updateStockStore = (id: string, stockData: Partial<StockStore>) => {
    const company = companies.find(c => c.name === stockData.companyId);
    if (stockData.companyId && !company) {
      message.error('Company does not exist');
      console.log(`Invalid company for stock store update: ${stockData.companyId}`);
      return;
    }
    setStockStores(prev =>
      prev.map(stock =>
        stock.id === id ? { ...stock, ...stockData, updatedAt: new Date().toISOString(), companyId: company?.id || stock.companyId } : stock
      )
    );
    message.success('Stock record updated successfully');
    console.log(`Updated StockStore ${id}:`, stockData);
  };

  const deleteStockStore = (id: string) => {
    const stockToDelete = stockStores.find(stock => stock.id === id);
    if (stockToDelete) {
      updateStock(stockToDelete.productId, stockToDelete.showroomId, (products.find(p => p.id === stockToDelete.productId)?.stock[stockToDelete.showroomId] || 0) - stockToDelete.quantity);
      setStockStores(prev => prev.filter(stock => stock.id !== id));
      message.success('Stock deleted successfully');
      console.log(`Deleted StockStore ${id}: product ${stockToDelete.productId}, showroom ${stockToDelete.showroomId}, quantity ${stockToDelete.quantity}`);
    }
  };

  const addCompany = (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: Company = {
      ...companyData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setCompanies(prev => [...prev, newCompany]);
    message.success('Company added successfully');
    console.log(`Added company ${newCompany.id}:`, newCompany);
    return newCompany;
  };

  const updateCompany = (id: string, companyData: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(company =>
        company.id === id ? { ...company, ...companyData, updatedAt: new Date().toISOString() } : company
      )
    );
    message.success('Company updated successfully');
    console.log(`Updated company ${id}:`, companyData);
  };

  const deleteCompany = (id: string) => {
    const companyStocks = stockStores.filter(stock => stock.companyId === id);
    if (companyStocks.length > 0) {
      message.error('Cannot delete company with associated stock records');
      console.log(`Cannot delete company ${id}: found ${companyStocks.length} associated stock records`);
      return;
    }
    setCompanies(prev => prev.filter(company => company.id !== id));
    message.success('Company deleted successfully');
    console.log(`Deleted company ${id}`);
  };

  const value: DataContextType = {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerBalance,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    showrooms,
    addShowroom,
    updateShowroom,
    deleteShowroom,
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



// import { LocalStorageService, STORAGE_KEYS, initializeDefaultData } from '../utils/localStorage';
// import { message } from 'antd';

// export interface Customer {
//   id: string;
//   name: string;
//   phone: string;
//   address: string;
//   village?: string;
//   taluka?: string;
//   district?: string;
//   notes?: string;
//   createdAt: string;
//   updatedAt?: string;
// }

// export interface Product {
//   id: string;
//   name: string;
//   category: 'Seeds' | 'Fertilizer' | 'Pesticide' | 'Equipment';
//   unit: string;
//   price: number;
//   gst: number;
//   image?: string;
//   description?: string;
//   stock: Record<string, number>;
//   createdAt: string;
//   updatedAt?: string;
//   companyName?: string;
//   type?: string;
//   subtype?: string;
//   inwardPrice?: number;
//   discount?: number;
// }

// export interface Showroom {
//   id: string;
//   name: string;
//   location: string;
//   contactPerson: string;
//   phone: string;
//   email: string;
//   createdAt: string;
//   updatedAt?: string;
// }

// export interface Employee {
//   id: string;
//   name: string;
//   role: string;
//   showroomId: string;
//   salary: number;
//   phone: string;
//   email: string;
//   avatar?: string;
//   paymentMethod: 'Cash' | 'Bank Transfer' | 'UPI';
//   advanceTaken: number;
//   createdAt: string;
//   updatedAt?: string;
// }

// export interface Order {
//   id: string;
//   orderNumber: string;
//   customerId: string;
//   customerName: string;
//   customerPhone: string;
//   customerAddress: string;
//   village?: string;
//   taluka?: string;
//   district?: string;
//   items: Array<{
//     productId: string;
//     productName: string;
//     quantity: number;
//     unit: string;
//     price: number;
//     gst: number;
//     discount?: number;
//     discountType?: 'percent' | 'amount';
//     totalAmount?: number;
//   }>;
//   subtotal: number;
//   totalGst: number;
//   total: number;
//   paidAmount?: number;
//   unpaidAmount?: number;
//   status: string;
//   showroomId: string;
//   createdAt: string;
//   updatedAt?: string;
// }

// export interface Transfer {
//   id: string;
//   productId: string;
//   productName: string;
//   fromShowroomId: string;
//   toShowroomId: string;
//   quantity: number;
//   status: 'Pending' | 'Approved' | 'Rejected';
//   requestedBy: string;
//   approvedBy?: string;
//   notes?: string;
//   createdAt: string;
//   updatedAt?: string;
// }

// export interface AttendanceRecord {
//   id: string;
//   employeeId: string;
//   date: string;
//   status: 'Present' | 'Absent' | 'Half Day' | 'Leave';
//   checkIn?: string;
//   checkOut?: string;
//   notes?: string;
//   createdAt: string;
// }

// export interface SalaryRecord {
//   id: string;
//   employeeId: string;
//   month: string;
//   baseSalary: number;
//   advanceTaken: number;
//   deductions: number;
//   bonus: number;
//   netSalary: number;
//   status: 'Pending' | 'Paid';
//   paidAt?: string;
//   createdAt: string;
// }

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   password: string;
//   role: 'Super Admin' | 'Showroom Admin' | 'Employee';
//   showroomId?: string;
//   avatar?: string;
// }

// export interface StockStore {
//   id: string;
//   productId: string;
//   showroomId: string;
//   quantity: number;
//   inwardDate: string;
//   companyId: string; // Reference to Company instead of companyName
//   category: string;
//   type: string;
//   subtype: string;
//   unit: string;
//   inwardPrice: number;
//   salePrice: number;
//   gst: number;
//   discount: number;
//   qty: number;
//   totalAmount: number;
//   availableStock: number;
//   barcode: string;
//   rack: string;
//   createdAt: string;
// }

// export interface Company {
//   id: string;
//   name: string;
//   address?: string;
//   phone?: string;
//   email?: string;
//   createdAt: string;
//   updatedAt?: string;
// }

// export interface AuthenticatedUser extends Omit<User, 'password'> {}

// interface AuthState {
//   isAuthenticated: boolean;
//   user: AuthenticatedUser | null;
//   role: string | null;
//   showroomId: string | null;
//   users: User[];
// }

// interface DataContextType {
//   customers: Customer[];
//   addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
//   updateCustomer: (id: string, customer: Partial<Customer>) => void;
//   deleteCustomer: (id: string) => void;
//   getCustomerBalance: (customerId: string) => { totalPaid: number; totalUnpaid: number };
//   products: Product[];
//   addProduct: (
//     product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
//     showroomId: string
//   ) => void;
//   updateProduct: (id: string, product: Partial<Product>) => void;
//   deleteProduct: (id: string) => void;
//   showrooms: Showroom[];
//   addShowroom: (showroomData: Omit<Showroom, 'id' | 'createdAt' | 'updatedAt'>) => string;
//   updateShowroom: (id: string, showroomData: Partial<Showroom>) => void;
//   deleteShowroom: (id: string) => void;
//   employees: Employee[];
//   addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
//   updateEmployee: (id: string, employee: Partial<Employee>) => void;
//   deleteEmployee: (id: string) => void;
//   orders: Order[];
//   addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => void;
//   updateOrder: (id: string, order: Partial<Order>) => void;
//   deleteOrder: (id: string) => void;
//   transfers: Transfer[];
//   addTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt'>) => void;
//   updateTransfer: (id: string, transfer: Partial<Transfer>) => void;
//   approveTransfer: (id: string, approvedBy: string) => void;
//   rejectTransfer: (id: string, rejectedBy: string) => void;
//   attendance: AttendanceRecord[];
//   markAttendance: (record: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
//   updateAttendance: (id: string, record: Partial<AttendanceRecord>) => void;
//   salaryRecords: SalaryRecord[];
//   addSalaryRecord: (record: Omit<SalaryRecord, 'id' | 'createdAt'>) => void;
//   updateSalaryRecord: (id: string, record: Partial<SalaryRecord>) => void;
//   updateStock: (productId: string, showroomId: string, quantity: number) => void;
//   transferStock: (productId: string, fromShowroom: string, toShowroom: string, quantity: number) => void;
//   generateOrderNumber: () => string;
//   getProductsByShowroom: (showroomId: string) => Array<Product & { availableStock: number }>;
//   getTotalStockValue: (showroomId?: string) => number;
//   calculateOrderTotal: (items: Order['items']) => { subtotal: number; totalGst: number; total: number };
//   createBill: (billData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => Order;
//   stockStores: StockStore[];
//   addStockStore: (stock: Omit<StockStore, 'id' | 'createdAt'>) => StockStore;
//   updateStockStore: (id: string, stock: Partial<StockStore>) => void;
//   deleteStockStore: (id: string) => void;
//   companies: Company[];
//   addCompany: (company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => Company;
//   updateCompany: (id: string, company: Partial<Company>) => void;
//   deleteCompany: (id: string) => void;
// }

// const DataContext = createContext<DataContextType | undefined>(undefined);

// export const DataProvider = ({ children }: { children: ReactNode }) => {
//   useEffect(() => {
//     initializeDefaultData();
//   }, []);

//   const [customers, setCustomers] = useState<Customer[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.CUSTOMERS, [])
//   );
//   const [products, setProducts] = useState<Product[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.PRODUCTS, [])
//   );
//   const [showrooms, setShowrooms] = useState<Showroom[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.SHOWROOMS, [])
//   );
//   const [employees, setEmployees] = useState<Employee[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.EMPLOYEES, [])
//   );
//   const [orders, setOrders] = useState<Order[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.ORDERS, [])
//   );
//   const [transfers, setTransfers] = useState<Transfer[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.TRANSFERS, [])
//   );
//   const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.ATTENDANCE, [])
//   );
//   const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(() =>
//     LocalStorageService.get(STORAGE_KEYS.SALARY_RECORDS, [])
//   );
//   const [stockStores, setStockStores] = useState<StockStore[]>(() =>
//     LocalStorageService.get('ag_stock_stores', [])
//   );
//   const [companies, setCompanies] = useState<Company[]>(() =>
//     LocalStorageService.get('ag_companies', [])
//   );

//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.CUSTOMERS, customers);
//   }, [customers]);
//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.PRODUCTS, products);
//   }, [products]);
//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.SHOWROOMS, showrooms);
//   }, [showrooms]);
//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.EMPLOYEES, employees);
//   }, [employees]);
//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.ORDERS, orders);
//   }, [orders]);
//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.TRANSFERS, transfers);
//   }, [transfers]);
//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.ATTENDANCE, attendance);
//   }, [attendance]);
//   useEffect(() => {
//     LocalStorageService.set(STORAGE_KEYS.SALARY_RECORDS, salaryRecords);
//   }, [salaryRecords]);
//   useEffect(() => {
//     LocalStorageService.set('ag_stock_stores', stockStores);
//   }, [stockStores]);
//   useEffect(() => {
//     LocalStorageService.set('ag_companies', companies);
//   }, [companies]);

//   const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

//   const generateOrderNumber = () => {
//     const date = new Date();
//     const year = date.getFullYear().toString().substr(-2);
//     const month = (date.getMonth() + 1).toString().padStart(2, '0');
//     const day = date.getDate().toString().padStart(2, '0');
//     const sequence = (orders.length + 1).toString().padStart(4, '0');
//     return `AG${year}${month}${day}${sequence}`;
//   };

//   const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
//     const newCustomer: Customer = {
//       ...customerData,
//       id: generateId(),
//       createdAt: new Date().toISOString()
//     };
//     setCustomers(prev => [...prev, newCustomer]);
//     message.success('Customer added successfully');
//     return newCustomer;
//   };

//   const updateCustomer = (id: string, customerData: Partial<Customer>) => {
//     setCustomers(prev =>
//       prev.map(customer =>
//         customer.id === id ? { ...customer, ...customerData, updatedAt: new Date().toISOString() } : customer
//       )
//     );
//     message.success('Customer updated successfully');
//   };

//   const deleteCustomer = (id: string) => {
//     setCustomers(prev => prev.filter(customer => customer.id !== id));
//     message.success('Customer deleted successfully');
//   };

//   const getCustomerBalance = (customerId: string) => {
//     const customerOrders = orders.filter(order => order.customerId === customerId);
//     return customerOrders.reduce(
//       (acc, order) => ({
//         totalPaid: acc.totalPaid + (order.paidAmount || 0),
//         totalUnpaid: acc.totalUnpaid + (order.unpaidAmount || 0)
//       }),
//       { totalPaid: 0, totalUnpaid: 0 }
//     );
//   };

//   const addProduct = (
//     productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
//     showroomId: string
//   ) => {
//     const newProduct: Product = {
//       ...productData,
//       id: generateId(),
//       createdAt: new Date().toISOString(),
//       inwardPrice: productData.inwardPrice || productData.price * 0.8,
//       discount: productData.discount || 0,
//       stock: { [showroomId]: productData.stock[showroomId] || 0 }
//     };
//     setProducts(prev => [...prev, newProduct]);
//     message.success('Product added successfully');
//   };

//   const updateProduct = (id: string, productData: Partial<Product>) => {
//     setProducts(prev =>
//       prev.map(product =>
//         product.id === id ? { ...product, ...productData, updatedAt: new Date().toISOString() } : product
//       )
//     );
//     message.success('Product updated successfully');
//   };

//   const deleteProduct = (id: string) => {
//     setProducts(prev => prev.filter(product => product.id !== id));
//     message.success('Product deleted successfully');
//   };

//   const addShowroom = (showroomData: Omit<Showroom, 'id' | 'createdAt' | 'updatedAt'>) => {
//     const newShowroom: Showroom = {
//       ...showroomData,
//       id: generateId(),
//       createdAt: new Date().toISOString(),
//     };
//     setShowrooms(prev => [...prev, newShowroom]);
//     message.success('Showroom added successfully');
//     return newShowroom.id;
//   };

//   const updateShowroom = (id: string, showroomData: Partial<Showroom>) => {
//     setShowrooms(prev =>
//       prev.map(showroom =>
//         showroom.id === id ? { ...showroom, ...showroomData, updatedAt: new Date().toISOString() } : showroom
//       )
//     );
//     message.success('Showroom updated successfully');
//   };

//   const deleteShowroom = (id: string) => {
//     setShowrooms(prev => prev.filter(showroom => showroom.id !== id));
//     message.success('Showroom deleted successfully');
//   };

//   const addEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt'>) => {
//     const newEmployee: Employee = {
//       ...employeeData,
//       id: generateId(),
//       createdAt: new Date().toISOString()
//     };
//     setEmployees(prev => [...prev, newEmployee]);
//     message.success('Employee added successfully');
//   };

//   const updateEmployee = (id: string, employeeData: Partial<Employee>) => {
//     setEmployees(prev =>
//       prev.map(employee =>
//         employee.id === id ? { ...employee, ...employeeData, updatedAt: new Date().toISOString() } : employee
//       )
//     );
//     message.success('Employee updated successfully');
//   };

//   const deleteEmployee = (id: string) => {
//     setEmployees(prev => prev.filter(employee => employee.id !== id));
//     message.success('Employee deleted successfully');
//   };

//   const addOrder = (orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
//     const { subtotal, totalGst, total } = calculateOrderTotal(orderData.items);
//     for (const item of orderData.items) {
//       const product = products.find(p => p.id === item.productId);
//       const stock = product?.stock[orderData.showroomId] || 0;
//       if (stock < item.quantity) {
//         message.error(`Insufficient stock for ${item.productName} in showroom`);
//         return;
//       }
//     }
//     const newOrder: Order = {
//       ...orderData,
//       id: generateId(),
//       orderNumber: generateOrderNumber(),
//       createdAt: new Date().toISOString(),
//       subtotal,
//       totalGst,
//       total,
//       paidAmount: orderData.paidAmount || 0,
//       unpaidAmount: orderData.paidAmount ? total - orderData.paidAmount : total
//     };
//     setOrders(prev => [...prev, newOrder]);
//     orderData.items.forEach(item => {
//       updateStock(
//         item.productId,
//         orderData.showroomId,
//         (products.find(p => p.id === item.productId)?.stock[orderData.showroomId] || 0) - item.quantity
//       );
//     });
//     message.success('Order created successfully');
//   };

//   const updateOrder = (id: string, orderData: Partial<Order>) => {
//     setOrders(prev =>
//       prev.map(order =>
//         order.id === id
//           ? {
//               ...order,
//               ...orderData,
//               updatedAt: new Date().toISOString(),
//               ...(orderData.items ? calculateOrderTotal(orderData.items) : {})
//             }
//           : order
//       )
//     );
//     message.success('Order updated successfully');
//   };

//   const deleteOrder = (id: string) => {
//     setOrders(prev => prev.filter(order => order.id !== id));
//     message.success('Order deleted successfully');
//   };

//   const createBill = (billData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>) => {
//     for (const item of billData.items) {
//       const product = products.find(p => p.id === item.productId);
//       const stock = product?.stock[billData.showroomId] || 0;
//       if (!product || stock < item.quantity) {
//         message.error(`Insufficient stock for ${item.productName} in showroom`);
//         throw new Error(`Insufficient stock for ${item.productName}`);
//       }
//     }
//     const { subtotal, totalGst, total } = calculateOrderTotal(billData.items);
//     const newBill: Order = {
//       ...billData,
//       id: generateId(),
//       orderNumber: generateOrderNumber(),
//       createdAt: new Date().toISOString(),
//       subtotal,
//       totalGst,
//       total,
//       paidAmount: billData.paidAmount || 0,
//       unpaidAmount: billData.paidAmount ? total - billData.paidAmount : total,
//     };
//     setOrders(prev => [...prev, newBill]);
//     billData.items.forEach(item => {
//       updateStock(
//         item.productId,
//         billData.showroomId,
//         (products.find(p => p.id === item.productId)?.stock[billData.showroomId] || 0) - item.quantity
//       );
//     });
//     message.success('Bill created successfully');
//     return newBill;
//   };

//   const addTransfer = (transferData: Omit<Transfer, 'id' | 'createdAt'>) => {
//     const newTransfer: Transfer = {
//       ...transferData,
//       id: generateId(),
//       createdAt: new Date().toISOString()
//     };
//     setTransfers(prev => [...prev, newTransfer]);
//     message.success('Transfer request created successfully');
//   };

//   const updateTransfer = (id: string, transferData: Partial<Transfer>) => {
//     setTransfers(prev =>
//       prev.map(transfer =>
//         transfer.id === id ? { ...transfer, ...transferData, updatedAt: new Date().toISOString() } : transfer
//       )
//     );
//     message.success('Transfer updated successfully');
//   };

//   const approveTransfer = (id: string, approvedBy: string) => {
//     const transfer = transfers.find(t => t.id === id);
//     if (transfer) {
//       const product = products.find(p => p.id === transfer.productId);
//       if (!product || (product.stock[transfer.fromShowroomId] || 0) < transfer.quantity) {
//         message.error('Insufficient stock for transfer');
//         return;
//       }
//       transferStock(transfer.productId, transfer.fromShowroomId, transfer.toShowroomId, transfer.quantity);
//       updateTransfer(id, {
//         status: 'Approved',
//         approvedBy,
//         updatedAt: new Date().toISOString()
//       });
//       message.success('Transfer approved and executed successfully');
//     }
//   };

//   const rejectTransfer = (id: string, rejectedBy: string) => {
//     updateTransfer(id, {
//       status: 'Rejected',
//       approvedBy: rejectedBy,
//       updatedAt: new Date().toISOString()
//     });
//     message.info('Transfer request rejected');
//   };

//   const markAttendance = (recordData: Omit<AttendanceRecord, 'id' | 'createdAt'>) => {
//     const newRecord: AttendanceRecord = {
//       ...recordData,
//       id: generateId(),
//       createdAt: new Date().toISOString()
//     };
//     setAttendance(prev => [...prev, newRecord]);
//     message.success('Attendance marked successfully');
//   };

//   const updateAttendance = (id: string, recordData: Partial<AttendanceRecord>) => {
//     setAttendance(prev =>
//       prev.map(record => (record.id === id ? { ...record, ...recordData } : record))
//     );
//     message.success('Attendance updated successfully');
//   };

//   const addSalaryRecord = (recordData: Omit<SalaryRecord, 'id' | 'createdAt'>) => {
//     const newRecord: SalaryRecord = {
//       ...recordData,
//       id: generateId(),
//       createdAt: new Date().toISOString()
//     };
//     setSalaryRecords(prev => [...prev, newRecord]);
//     message.success('Salary record created successfully');
//   };

//   const updateSalaryRecord = (id: string, recordData: Partial<SalaryRecord>) => {
//     setSalaryRecords(prev =>
//       prev.map(record => (record.id === id ? { ...record, ...recordData } : record))
//     );
//     message.success('Salary record updated successfully');
//   };

//   const updateStock = (productId: string, showroomId: string, quantity: number) => {
//     if (quantity < 0) {
//       message.error('Stock quantity cannot be negative');
//       return;
//     }
//     setProducts(prev =>
//       prev.map(product => {
//         if (product.id === productId) {
//           return {
//             ...product,
//             stock: {
//               ...product.stock,
//               [showroomId]: quantity
//             },
//             updatedAt: new Date().toISOString()
//           };
//         }
//         return product;
//       })
//     );
//     message.success('Stock updated successfully');
//   };

//   const transferStock = (productId: string, fromShowroom: string, toShowroom: string, quantity: number) => {
//     setProducts(prev =>
//       prev.map(product => {
//         if (product.id === productId) {
//           const fromStock = product.stock[fromShowroom] || 0;
//           const toStock = product.stock[toShowroom] || 0;
//           if (fromStock >= quantity) {
//             return {
//               ...product,
//               stock: {
//                 ...product.stock,
//                 [fromShowroom]: fromStock - quantity,
//                 [toShowroom]: toStock + quantity
//               },
//               updatedAt: new Date().toISOString()
//             };
//           } else {
//             message.error('Insufficient stock for transfer');
//             return product;
//           }
//         }
//         return product;
//       })
//     );
//   };

//   const getProductsByShowroom = (showroomId: string) => {
//     return products.map(product => ({
//       ...product,
//       availableStock: product.stock[showroomId] || 0
//     }));
//   };

//   const getTotalStockValue = (showroomId?: string) => {
//     return products.reduce((total, product) => {
//       if (showroomId) {
//         const stock = product.stock[showroomId] || 0;
//         return total + stock * product.price;
//       }
//       const totalStock = Object.values(product.stock).reduce((sum, qty) => sum + qty, 0);
//       return total + totalStock * product.price;
//     }, 0);
//   };

//   const calculateOrderTotal = (items: Order['items']) => {
//     return items.reduce(
//       (acc, item) => {
//         const discount = item.discount || 0;
//         let priceAfterDiscount: number;
//         if (item.discountType === 'amount') {
//           priceAfterDiscount = item.price - discount;
//         } else {
//           priceAfterDiscount = item.price * (1 - discount / 100);
//         }
//         const itemSubtotal = priceAfterDiscount * item.quantity;
//         const itemGst = (priceAfterDiscount * item.gst * item.quantity) / 100;
//         return {
//           subtotal: acc.subtotal + itemSubtotal,
//           totalGst: acc.totalGst + itemGst,
//           total: acc.total + itemSubtotal + itemGst,
//         };
//       },
//       { subtotal: 0, totalGst: 0, total: 0 }
//     );
//   };

//   const addStockStore = (stockData: Omit<StockStore, 'id' | 'createdAt'>) => {
//     const company = companies.find(c => c.name === stockData.companyId);
//     if (!company) {
//       message.error('Company does not exist');
//       return;
//     }
//     const newStockStore: StockStore = {
//       ...stockData,
//       id: generateId(),
//       createdAt: new Date().toISOString(),
//       companyId: company.id,
//       availableStock: stockData.quantity,
//       totalAmount: stockData.qty * stockData.salePrice
//     };
//     setStockStores(prev => [...prev, newStockStore]);
//     updateStock(stockData.productId, stockData.showroomId, (products.find(p => p.id === stockData.productId)?.stock[stockData.showroomId] || 0) + stockData.quantity);
//     message.success('Stock added successfully');
//     return newStockStore;
//   };

//   const updateStockStore = (id: string, stockData: Partial<StockStore>) => {
//     const company = companies.find(c => c.name === stockData.companyId);
//     if (stockData.companyId && !company) {
//       message.error('Company does not exist');
//       return;
//     }
//     setStockStores(prev =>
//       prev.map(stock =>
//         stock.id === id ? { ...stock, ...stockData, updatedAt: new Date().toISOString(), companyId: company?.id || stock.companyId } : stock
//       )
//     );
//     message.success('Stock record updated successfully');
//   };

//   const deleteStockStore = (id: string) => {
//     const stockToDelete = stockStores.find(stock => stock.id === id);
//     if (stockToDelete) {
//       updateStock(stockToDelete.productId, stockToDelete.showroomId, (products.find(p => p.id === stockToDelete.productId)?.stock[stockToDelete.showroomId] || 0) - stockToDelete.quantity);
//       setStockStores(prev => prev.filter(stock => stock.id !== id));
//       message.success('Stock deleted successfully');
//     }
//   };

//   const addCompany = (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
//     const newCompany: Company = {
//       ...companyData,
//       id: generateId(),
//       createdAt: new Date().toISOString()
//     };
//     setCompanies(prev => [...prev, newCompany]);
//     message.success('Company added successfully');
//     return newCompany;
//   };

//   const updateCompany = (id: string, companyData: Partial<Company>) => {
//     setCompanies(prev =>
//       prev.map(company =>
//         company.id === id ? { ...company, ...companyData, updatedAt: new Date().toISOString() } : company
//       )
//     );
//     message.success('Company updated successfully');
//   };

//   const deleteCompany = (id: string) => {
//     const companyStocks = stockStores.filter(stock => stock.companyId === id);
//     if (companyStocks.length > 0) {
//       message.error('Cannot delete company with associated stock records');
//       return;
//     }
//     setCompanies(prev => prev.filter(company => company.id !== id));
//     message.success('Company deleted successfully');
//   };

//   const value: DataContextType = {
//     customers,
//     addCustomer,
//     updateCustomer,
//     deleteCustomer,
//     getCustomerBalance,
//     products,
//     addProduct,
//     updateProduct,
//     deleteProduct,
//     showrooms,
//     addShowroom,
//     updateShowroom,
//     deleteShowroom,
//     employees,
//     addEmployee,
//     updateEmployee,
//     deleteEmployee,
//     orders,
//     addOrder,
//     updateOrder,
//     deleteOrder,
//     transfers,
//     addTransfer,
//     updateTransfer,
//     approveTransfer,
//     rejectTransfer,
//     attendance,
//     markAttendance,
//     updateAttendance,
//     salaryRecords,
//     addSalaryRecord,
//     updateSalaryRecord,
//     updateStock,
//     transferStock,
//     generateOrderNumber,
//     getProductsByShowroom,
//     getTotalStockValue,
//     calculateOrderTotal,
//     createBill,
//     stockStores,
//     addStockStore,
//     updateStockStore,
//     deleteStockStore,
//     companies,
//     addCompany,
//     updateCompany,
//     deleteCompany,
//   };

//   return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
// };

// export const useData = () => {
//   const context = useContext(DataContext);
//   if (context === undefined) {
//     throw new Error('useData must be used within a DataProvider');
//   }
//   return context;
// }; 