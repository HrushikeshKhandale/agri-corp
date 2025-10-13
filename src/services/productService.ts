// src/services/productService.ts
import axiosInstance from './axiosInstance';

export interface Product {
  id?: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  gst: number;
  stock: number;
  imageUrl: string;
  description: string;
  companyName: string;
  type: string;
  subtype: string;
  inwardPrice: number;
  discount: number;
  showroom?: {
    id: number;
  };
}

export type ProductPayload = Omit<Product, 'id'>;

const BASE_URL = '/agri/api/products';

const productService = {
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const response = await axiosInstance.get(BASE_URL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch products');
      throw new Error('Unable to load products');
    }
  },

  getProductById: async (id: number): Promise<Product> => {
    try {
      const response = await axiosInstance.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch product');
      throw new Error('Product not found');
    }
  },

  createProduct: async (data: ProductPayload): Promise<Product> => {
    try {
      const response = await axiosInstance.post(BASE_URL, data);
      return response.data;
    } catch (error) {
      console.error('Failed to create product');
      throw new Error('Unable to create product');
    }
  },

  updateProduct: async (id: number, data: Partial<Product>): Promise<Product> => {
    try {
      const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Failed to update product');
      throw new Error('Unable to update product');
    }
  },

  deleteProduct: async (id: number): Promise<void> => {
    try {
      await axiosInstance.delete(`${BASE_URL}/${id}`);
    } catch (error) {
      console.error('Failed to delete product');
      throw new Error('Unable to delete product');
    }
  },
};

export default productService;

// // src/services/productService.ts
// import axiosInstance from './axiosInstance';

// // Define Product type (match your API)
// export interface Product {
//   id?: number;
//   name: string;
//   category: string;
//   unit: string;
//   price: number;
//   gst: number;
//   stock: number;
//   imageUrl: string;
//   description: string;
//   companyName: string;
//   type: string;
//   subtype: string;
//   inwardPrice: number;
//   discount: number;
//   showroom?: {
//     id: number;
//   };
// }

// // Payload for create/update (without 'id' for create)
// export type ProductPayload = Omit<Product, 'id'>;

// const BASE_URL = '/agri/api/products';

// const productService = {
//   // 1. Get All Products
//   getAllProducts: async (): Promise<Product[]> => {
//     const response = await axiosInstance.get(BASE_URL);
//     return response.data;
//   },

//   // 2. Get Product by ID
//   getProductById: async (id: number): Promise<Product> => {
//     const response = await axiosInstance.get(`${BASE_URL}/${id}`);
//     return response.data;
//   },

//   // 3. Create Product
//   createProduct: async (data: ProductPayload): Promise<Product> => {
//     const response = await axiosInstance.post(BASE_URL, data);
//     return response.data;
//   },

//   // 4. Update Product
//   updateProduct: async (id: number, data: ProductPayload): Promise<Product> => {
//     const response = await axiosInstance.put(`${BASE_URL}/${id}`, data);
//     return response.data;
//   },

//   // 5. Delete Product
//   deleteProduct: async (id: number): Promise<void> => {
//     await axiosInstance.delete(`${BASE_URL}/${id}`);
//   },
// };

// export default productService;