/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api.ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

console.log("API URL:", API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar token em TODAS as requisições
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let isRedirecting = false; // ← flag fora do interceptor

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !isRedirecting
    ) {
      isRedirecting = true;
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Tipos
export interface User {
  id: string;
  nome: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "LIDER";
  organizationId?: string;
  groups: {
    id: string;
    nome: string;
    permission: string;
  }[];
}

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
};

// Users
export const usersAPI = {
  getMyGroups: () => api.get("/users/me/groups"),
  getAll: () => api.get("/users"),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  updateMe: (
    id: string,
    data: { nome?: string; email?: string; senha?: string },
  ) => api.patch(`/users/${id}`, data),
};

// Groups
export const groupsAPI = {
  getAll: () => api.get("/groups"),
  getOne: (id: string) => api.get(`/groups/${id}`),
  getSaldos: (id: string) => api.get(`/groups/${id}/saldos`),
  getBalance: (id: string) => api.get(`/groups/${id}/balance`),
  updateSaldoInicial: (id: string, saldoInicial: number) =>
    api.post(`/groups/${id}/saldo-inicial`, { saldoInicial }),
  create: (data: {
    nome: string;
    organizationId: string;
    saldoInicial?: number;
  }) => api.post("/groups", data),
};

// Transactions
export const transactionsAPI = {
  getAll: (params?: {
    type?: string;
    paymentType?: string;
    groupId?: string;
  }) => api.get("/transactions", { params }),
  getByGroup: (groupId: string, type?: string) =>
    api.get(`/transactions/group/${groupId}`, { params: { type } }),
  create: (data: any) => api.post("/transactions", data),
  update: (id: string, data: any) => api.patch(`/transactions/${id}`, data),
};

// Admin
export const adminAPI = {
  getOrganizations: () => api.get("/admin/organizations"),
  getOrganization: (id: string) => api.get(`/admin/organizations/${id}`),
  getOrganizationBalance: (id: string) =>
    api.get(`/admin/organizations/${id}/balances`),
  getMyOrganization: () => api.get("/admin/my-organization"),
  getMyOrganizationBalance: () => api.get("/admin/my-organization/balances"),
  createOrganization: (data: any) =>
    api.post("/admin/create-organization", data),
};

export const userGroupsAPI = {
  create: (data: { userId: string; groupId: string; permission?: string }) =>
    api.post("/user-groups", data),
  remove: (groupId: string, userId: string) =>
    api.delete(`/user-groups/${groupId}/${userId}`),
  updatePermission: (groupId: string, userId: string, permission: string) =>
    api.patch(`/user-groups/${groupId}/${userId}/permission`, { permission }),
  getByGroup: (groupId: string) => api.get(`/user-groups/group/${groupId}`),
  getByUser: (userId: string) => api.get(`/user-groups/user/${userId}`),
};

export const dashboardApi = {
  get: () => api.get("/dashboard"),
};
