import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
});

// Request Interceptor: Automatically attach Authorization header
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export const httpClient = {
  get: async (endpoint: string, params?: Record<string, any>) => {
    const response = await apiClient.get(endpoint, { params });

    return response.data.data || [];
  },

  post: async (endpoint: string, data: any) => {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  },

  put: async (endpoint: string, data: any) => {
    const response = await apiClient.put(endpoint, data);
    return response.data.data;
  },

  delete: async (endpoint: string) => {
    const response = await apiClient.delete(endpoint);
    return response.data.data;
  },
};