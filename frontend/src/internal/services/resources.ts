import { api } from "../../lib/api";
import type { ListResponse } from "../types/types";

const prefix = (endpoint: string) => `/internal${endpoint}`;

export const fetchList = async <T>(endpoint: string) => {
  const { data } = await api.get<ListResponse<T>>(prefix(endpoint));
  return data;
};

export const fetchDetail = async <T>(endpoint: string) => {
  const { data } = await api.get<T>(prefix(endpoint));
  return data;
};

export const createResource = async <T, P>(endpoint: string, payload: P) => {
  const { data } = await api.post<T>(prefix(endpoint), payload);
  return data;
};

export const updateResource = async <T, P>(endpoint: string, payload: P) => {
  const { data } = await api.put<T>(prefix(endpoint), payload);
  return data;
};

export const postResource = async <T, P>(endpoint: string, payload: P) => {
  const { data } = await api.post<T>(prefix(endpoint), payload);
  return data;
};

export const deleteResource = async <T>(endpoint: string) => {
  const { data } = await api.delete<T>(prefix(endpoint));
  return data;
};
