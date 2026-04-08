import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("hotelcompleto_session");

  if (raw) {
    const session = JSON.parse(raw) as { token?: string };
    if (session.token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  }

  return config;
});
