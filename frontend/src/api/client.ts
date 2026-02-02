import axios from "axios";

export const API_URL =
  (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3001";

export const api = axios.create({ baseURL: API_URL });

const ACCESS_TOKEN_KEY = "accessToken";

export function setAuthToken(token: string | null) {
  if (token) api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete api.defaults.headers.common["Authorization"];
}

// Always attach token from localStorage (covers refresh / missed setAuthToken)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (token) {
    // Axios v1: headers is AxiosHeaders (has .set)
    if (config.headers && typeof (config.headers as any).set === "function") {
      (config.headers as any).set("Authorization", `Bearer ${token}`);
    } else {
      // Fallback
      (config.headers as any) = {
        ...(config.headers as any),
        Authorization: `Bearer ${token}`,
      };
    }
  } else {
    // If no token, make sure we don't send stale auth header
    if (config.headers && typeof (config.headers as any).delete === "function") {
      (config.headers as any).delete("Authorization");
    } else if (config.headers) {
      delete (config.headers as any).Authorization;
    }
  }

  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err)
);
