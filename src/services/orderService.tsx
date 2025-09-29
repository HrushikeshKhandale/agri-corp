import axiosInstance from './axiosInstance';

// Define types
export interface OrderItem {
  product: string;
  quantity: number;
}

export interface Order {
  id?: number;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
  showroom: {
    id: number;
  };
  orderItems: OrderItem[];
}

const BASE_URL = '/api/orders';
const CREATE_URL = '/agri/api/orders';

const orderService = {
  // 1. Get all orders
  getAllOrders: async (): Promise<Order[]> => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },

  // 2. Get order by ID
  getOrderById: async (id: number): Promise<Order> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // 3. Create a new order
  createOrder: async (orderData: Order): Promise<Order> => {
    const response = await axiosInstance.post(CREATE_URL, orderData);
    return response.data;
  },

  // 4. Update an order
  updateOrder: async (id: number, updatedData: Order): Promise<Order> => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, updatedData);
    return response.data;
  },

  // 5. Delete an order
  deleteOrder: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },
};

export default orderService;
