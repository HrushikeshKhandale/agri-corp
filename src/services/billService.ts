import axiosInstance from './axiosInstance';
import { Bill, BillItem } from './types/bill';


const BASE_URL = '/agri/api/bills';

const billService = {
  createBill: async (billData: Omit<Bill, 'id'>): Promise<Bill> => {
    const response = await axiosInstance.post(BASE_URL, billData);
    return response.data;
  },

  updateBill: async (id: number, billData: Omit<Bill, 'id'>): Promise<Bill> => {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, billData);
    return response.data;
  },

  getBillById: async (id: number): Promise<Bill> => {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  },

  getAllBills: async (): Promise<Bill[]> => {
    const response = await axiosInstance.get(BASE_URL);
    if (typeof response.data === 'string') {
      // Decode HTML entities before parsing JSON
      const decodedData = response.data
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
      return JSON.parse(decodedData);
    }
    return response.data;
  },

  deleteBill: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },
};

export default billService;