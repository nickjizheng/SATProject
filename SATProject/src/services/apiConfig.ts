const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const defaultApiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:8080/api'
  : '/api';

export const API_BASE_URL = (configuredApiBaseUrl || defaultApiBaseUrl).replace(/\/+$/, '');
