// src/services/stockService.ts
import axiosInstance from './axiosInstance';

// Define Stock type (match your API)
export interface Stock {
  id?: number;
  inwardDate: string; // ISO date string
  companyName: string;
  product: {
    id: number;
  };
  showroom: {
    id: number;
  };
  category: string;
  unit: string;
  inwardPrice: number;
  salePrice: number;
  gst: number;
  discount: number;
  quantity: number;
  totalAmount: number;
  barcode: string;
  rack: string;
}

// Payload for create/update (without 'id' for create)
export type StockPayload = Omit<Stock, 'id'>;

const BASE_URL = '/agri/api/stocks';

const stockService = {
  // 1. Get All Stocks
  getAllStocks: async (): Promise<Stock[]> => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  },

  // 2. Get Stock by ID
  getStockById: async (id: number): Promise<Stock> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  // 3. Create Stock
  createStock: async (data: StockPayload): Promise<Stock> => {
    const response = await axiosInstance.post(BASE_URL, data);
    return response.data;
  },

  // 4. Update Stock
  updateStock: async (id: number, data: StockPayload): Promise<Stock> => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
    return response.data;
  },

  // 5. Delete Stock
  deleteStock: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },
};

export default stockService;