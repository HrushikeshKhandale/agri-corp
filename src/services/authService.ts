// src/services/authService.ts
import axiosInstance from './axiosInstance';

// src/services/authService.ts

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/agri/api/auth/login', credentials);
  return response.data;
};