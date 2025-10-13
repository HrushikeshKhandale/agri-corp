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
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  deleteBill: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },
};

export default billService;