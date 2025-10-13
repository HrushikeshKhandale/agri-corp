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
    const response = await axiosInstance.get<UsersResponse>('/agri/api/admin/getAllUsers');
    return response.data;
  },

  // Get all employees
  getAllEmployees: async (): Promise<Employee[]> => {
    const response = await axiosInstance.get<Employee[]>('/agri/api/users/allEmployee');
    return response.data;
  },

  // Register new user
  registerUser: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await axiosInstance.post<RegisterResponse>('/agri/api/auth/register', userData);
    return response.data;
  }
};

export default userService;