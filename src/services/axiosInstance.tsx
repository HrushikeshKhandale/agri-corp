// src/utils/axiosInstance.tsx
import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to safely get token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }

    console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error: AxiosError) => {
    console.error('[Request Error]', error);
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('[Response]', response);
    return response;
  },
  (error: AxiosError) => {
    console.error('[Response Error]', error);

    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        console.warn('Unauthorized. Redirecting to login...');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else if (status === 500) {
        console.error('Internal server error.');
      }
    } else if (error.request) {
      console.error('No response received from server.');
    } else {
      console.error('Axios error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;


// import axios, {
//   AxiosInstance,
//   AxiosResponse,
//   AxiosError,
//   InternalAxiosRequestConfig
// } from 'axios';

// const axiosInstance: AxiosInstance = axios.create({
//   baseURL: 'http://localhost:8080',
//   timeout: 10000,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// // Helper to safely get token
// const getAuthToken = (): string | null => {
//   if (typeof window === 'undefined') return null;
//   return localStorage.getItem('authToken');
// };

// // REQUEST INTERCEPTOR
// axiosInstance.interceptors.request.use(
//   (config: InternalAxiosRequestConfig) => {
//     const token = getAuthToken();
//     if (token) {
//       config.headers.set('Authorization', `Bearer ${token}`);
//     }

//     console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`);
//     return config;
//   },
//   (error: AxiosError) => {
//     console.error('[Request Error]', error);
//     return Promise.reject(error);
//   }
// );

// // RESPONSE INTERCEPTOR
// axiosInstance.interceptors.response.use(
//   (response: AxiosResponse) => {
//     console.log('[Response]', response);
//     return response;
//   },
//   (error: AxiosError) => {
//     console.error('[Response Error]', error);

//     if (error.response) {
//       const { status } = error.response;

//       if (status === 401) {
//         console.warn('Unauthorized. Redirecting to login...');
//         if (typeof window !== 'undefined') {
//           localStorage.removeItem('authToken');
//           window.location.href = '/login';
//         }
//       } else if (status === 500) {
//         console.error('Internal server error.');
//         // Optionally: show user-friendly message
//       }
//     } else if (error.request) {
//       console.error('No response received from server.');
//     } else {
//       console.error('Axios error:', error.message);
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;