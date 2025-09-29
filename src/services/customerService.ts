// src/services/customerService.ts

import axiosInstance from './axiosInstance';
import { Customer } from './types/customer';

const BASE_AGRI_URL = '/agri/api/customers';

const customerService = {
  getAllCustomers: async (): Promise<Customer[]> => {
    const response = await axiosInstance.get(BASE_AGRI_URL);
    return response.data;
  },

  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await axiosInstance.get(`${BASE_AGRI_URL}/${id}`);
    return response.data;
  },

  createCustomer: async (data: Customer): Promise<Customer> => {
    const response = await axiosInstance.post(BASE_AGRI_URL, data);
    return response.data;
  },

  updateCustomer: async (id: number, data: Customer): Promise<Customer> => {
    const response = await axiosInstance.put(`${BASE_AGRI_URL}/${id}`, data); // ✅ Fixed: Use BASE_AGRI_URL
    return response.data;
  },

  deleteCustomer: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_AGRI_URL}/${id}`); // ✅ Fixed: Use BASE_AGRI_URL
  },
};

export default customerService;