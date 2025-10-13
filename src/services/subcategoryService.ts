import axiosInstance from './axiosInstance';
import { SubCategory, CreateSubCategoryRequest, UpdateSubCategoryRequest } from './types/subcategory';

const API_BASE = '/api/subcategories';

export const subcategoryService = {
  create: async (data: CreateSubCategoryRequest): Promise<SubCategory> => {
    const response = await axiosInstance.post<SubCategory>(API_BASE, data);
    return response.data;
  },

  getAll: async (): Promise<SubCategory[]> => {
    const response = await axiosInstance.get<SubCategory[]>(API_BASE);
    return response.data;
  },

  getById: async (id: number): Promise<SubCategory> => {
    const response = await axiosInstance.get<SubCategory>(`${API_BASE}/${id}`);
    return response.data;
  },

  update: async (id: number, data: UpdateSubCategoryRequest): Promise<SubCategory> => {
    const response = await axiosInstance.put<SubCategory>(`${API_BASE}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE}/${id}`);
  }
};