import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      async login(credentials) {
        const { data } = await axios.post(`${API_BASE}/auth/login`, credentials);
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return data.user;
      },
      async registerStudent(payload) {
        const { data } = await axios.post(`${API_BASE}/auth/register`, payload);
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return data.user;
      },
      loginAs(role = "student", overrides = {}) {
        const base =
          role === "admin"
            ? {
                id: "admin-placement-cell",
                name: "Placement Cell Admin",
                email: "placement.cell@tnpconnect.edu",
                role: "admin",
              }
            : {
                id: "student-aarav",
                name: "Aarav Malhotra",
                email: "aarav.malhotra@university.edu",
                role: "student",
              };
        set({
          user: { ...base, ...overrides },
          accessToken: `demo-token-${role}`,
          refreshToken: `demo-refresh-${role}`,
        });
      },
      logout() {
        const { refreshToken } = get();
        if (refreshToken) {
          axios.post(`${API_BASE}/auth/logout`, { refreshToken }).catch(() => {});
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },
      setTokens(accessToken, refreshToken) {
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        }));
      },
    }),
    {
      name: "tnp-connect-auth",
    },
  ),
);
