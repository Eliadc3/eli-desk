import axios from "axios";

export const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3001";

export const api = axios.create({ baseURL: API_URL });

export function setAuthToken(token: string | null) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // allow UI to handle 401 centrally if needed
    return Promise.reject(err);
  }
);
