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
      const data = error.response.data ?? {};
      const message =
        data.message ||
        data.detail?.message ||
        (typeof data.detail === 'string' ? data.detail : null) ||
        error.message ||
        'Request failed';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

export type HttpClient = typeof httpClient;
