import axiosInstance from './axiosInstance';
import { Section, CreateSectionRequest, UpdateSectionRequest } from './types/section';

const API_BASE = '/api/sections';

export const sectionService = {
  // Create section
  create: async (data: CreateSectionRequest): Promise<Section> => {
    const response = await axiosInstance.post<Section>(API_BASE, data);
    return response.data;
  },

  // Get all sections
  getAll: async (): Promise<Section[]> => {
    const response = await axiosInstance.get<Section[]>(API_BASE);
    return response.data;
  },

  // Get section by ID
  getById: async (id: number): Promise<Section> => {
    const response = await axiosInstance.get<Section>(`${API_BASE}/${id}`);
    return response.data;
  },

  // Update section
  update: async (id: number, data: UpdateSectionRequest): Promise<Section> => {
    const response = await axiosInstance.put<Section>(`${API_BASE}/${id}`, data);
    return response.data;
  },

  // Delete section
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${API_BASE}/${id}`);
  }
};