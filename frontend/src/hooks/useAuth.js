import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const login = useAuthStore((state) => state.login);
  const loginAs = useAuthStore((state) => state.loginAs);
  const logout = useAuthStore((state) => state.logout);

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: Boolean(user),
    login,
    loginAs,
    logout,
  };
}
