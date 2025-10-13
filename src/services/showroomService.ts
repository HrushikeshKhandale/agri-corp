// src/services/showroomService.ts

import axiosInstance from './axiosInstance';
import { Showroom, ShowroomPayload } from './types/showroom';

const BASE_AGRI_URL = '/agri/api/showrooms';

const showroomService = {
  getAllShowrooms: async (): Promise<Showroom[]> => {
    const response = await axiosInstance.get(BASE_AGRI_URL);
    return response.data;
  },

  getShowroomById: async (id: number): Promise<Showroom> => {
    const response = await axiosInstance.get(`${BASE_AGRI_URL}/${id}`);
    return response.data;
  },

  createShowroom: async (data: ShowroomPayload): Promise<Showroom> => {
    const response = await axiosInstance.post(BASE_AGRI_URL, data);
    return response.data;
  },

  updateShowroom: async (id: number, data: Partial<Showroom>): Promise<Showroom> => {
    const response = await axiosInstance.put(`${BASE_AGRI_URL}/${id}`, data);
    return response.data;
  },

  deleteShowroom: async (id: number): Promise<void> => {
    await axiosInstance.delete(`${BASE_AGRI_URL}/${id}`);
  },
};

export default showroomService;