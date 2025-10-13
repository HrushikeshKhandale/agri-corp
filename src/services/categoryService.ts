import axiosInstance from './axiosInstance';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from './types/category';

const API_BASE = '/agri/api/categories';

export const categoryService = {
  // Create category
  create: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await axiosInstance.post<Category>(API_BASE, data);
    return response.data;
  },

  // Get all categories
  getAll: async (): Promise<Category[]> => {
    const response = await axiosInstance.get<Category[]>(API_BASE);
    return response.data;
  },

  // Get category by ID
  getById: async (id: number): Promise<Category> => {
    const response = await axiosInstance.get<Category>(`${API_BASE}/${id}`);
    return response.data;
  },

  // Update category
  update: async (id: number, data: UpdateCategoryRequest): Promise<Category> => {
    const response = await axiosInstance.put<Category>(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // Delete category
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE}/${id}`);
  }
};