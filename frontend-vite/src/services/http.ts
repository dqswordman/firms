import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export const httpClient = axios.create({
  baseURL,
  timeout: 30000,
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.message ?? error.message;
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export type HttpClient = typeof httpClient;
