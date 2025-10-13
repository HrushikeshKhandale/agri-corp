import axiosInstance from './axiosInstance';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface UsersResponse {
  count: number;
  Users: User[];
}

export interface Employee {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface RegisterResponse {
  username: string;
  password: string;
  email: string;
  role: string;
  createdAt: string;
}

const userService = {
  // Get all users
  getAllUsers: async (): Promise<UsersResponse> => {
    try {
      const response = await axiosInstance.get<UsersResponse>('/agri/api/admin/getAllUsers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all employees
  getAllEmployees: async (): Promise<Employee[]> => {
    try {
      const response = await axiosInstance.get<Employee[]>('/agri/api/users/allEmployee');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Register new user
  registerUser: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await axiosInstance.post<RegisterResponse>('/agri/api/auth/register', userData);
      console.log('User registered successfully:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.log('User registered error:',error);

      const errorMessage = error.response?.data || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }
};

export default userService;