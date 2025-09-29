import axiosInstance from './axiosInstance';
import { Customer } from './types/customer';

const BASE_AGRI_URL = '/agri/api/customers';
const BASE_API_URL = '/api/customers';

const customerService = {
  // 1. Get all customers
  getAllCustomers: async (): Promise<Customer[]> => {
    const response = await axiosInstance.get(BASE_AGRI_URL);
    return response.data;
  },

  // 2. Get customer by ID
  getCustomerById: async (id: number): Promise<Customer> => {
    const response = await axiosInstance.get(`${BASE_AGRI_URL}/${id}`);
    return response.data;
  },

  // 3. Create a customer
  createCustomer: async (data: Customer): Promise<Customer> => {
    const response = await axiosInstance.post(BASE_AGRI_URL, data);
    return response.data;
  },

  // 4. Update a customer
  updateCustomer: async (id: number, data: Customer): Promise<Customer> => {
    const response = await axiosInstance.put(`${BASE_API_URL}/${id}`, data);
    return response.data;
  },

  // 5. Delete a customer
  deleteCustomer: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_API_URL}/${id}`);
  },
};

export default customerService;
