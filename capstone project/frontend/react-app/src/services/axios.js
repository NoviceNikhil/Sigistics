import axios from "axios";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {},
  withCredentials: true, //   REQUIRED for cookies
});

//   Request interceptor — attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

//   Response interceptor — handle 401 safely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.log("🔴 Unauthorized - clearing session");

      // Clear client state
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      //    IMPORTANT: prevent redirect loop during OAuth flow
      const currentPath = window.location.pathname;

      if (
        !currentPath.includes("/login") &&
        !currentPath.includes("/oauth-success")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export default api;
