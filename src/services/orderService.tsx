// src/services/orderService.ts

import axiosInstance from './axiosInstance';

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

const BASE_AGRI_URL = '/agri/api/orders';

const orderService = {
  getAllOrders: async (): Promise<Order[]> => {
    const response = await axiosInstance.get(BASE_AGRI_URL);
    return response.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const response = await axiosInstance.get(`${BASE_AGRI_URL}/${id}`);
    return response.data;
  },

  createOrder: async (orderData: Order): Promise<Order> => {
    const response = await axiosInstance.post(BASE_AGRI_URL, orderData);
    return response.data;
  },

  updateOrder: async (id: number, updatedData: Order): Promise<Order> => {
    const response = await axiosInstance.put(`${BASE_AGRI_URL}/${id}`, updatedData);
    return response.data;
  },

  deleteOrder: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_AGRI_URL}/${id}`);
  },
};

export default orderService;