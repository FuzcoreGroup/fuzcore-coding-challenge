import { useLocalStorage } from "./useLocalStorage";

export function useAuth() {
  const [token, setToken, removeToken] = useLocalStorage<string | null>(
    "fuzcore_token",
    null,
  );

  const isAuthenticated = !!token;

  const login = (newToken: string) => setToken(newToken);

  const logout = () => removeToken();

  const authHeaders = (): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  };

  return { token, isAuthenticated, login, logout, authHeaders };
}
