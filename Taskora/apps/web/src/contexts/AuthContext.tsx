"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { authApi } from "@/lib/api";

// ─── Types matching YOUR actual backend response ─────────────────────────────
export type Role = "OWNER" | "ADMIN" | "MEMBER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string;
  organizationName: string;
}

// Shape your NestJS /auth/login actually returns
interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string };
  organizations: {
    organizationId: string;
    organizationName: string;
    role: Role;
  }[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  isOwner: boolean;
  isAdmin: boolean;
  isUser: boolean;
  canManageMembers: boolean;
  canPurgeTasks: boolean;
  canSeeAllTasks: boolean;
  canSeeLogs: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "tf_token";
const USER_KEY = "tf_user";
const ORG_KEY = "tf_org_id";

// ─── Read localStorage synchronously so first render already has user ────────
function loadFromStorage(): { user: User | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      return { user: JSON.parse(storedUser), token: storedToken };
    }
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialise synchronously — no useEffect needed, no loading flash
  const [user, setUser] = useState<User | null>(() => loadFromStorage().user);
  const [token, setToken] = useState<string | null>(() => loadFromStorage().token);

  // isLoading is always false because state is ready on first render
  const isLoading = false;

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const res = await authApi.login(credentials);
      const data: BackendLoginResponse = res.data;

      // Role lives inside organizations[], not on user directly
      const firstOrg = data.organizations?.[0];
      if (!firstOrg) throw new Error("No organization found for this user.");

      const enrichedUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: firstOrg.role,
        organizationId: firstOrg.organizationId,
        organizationName: firstOrg.organizationName,
      };

      localStorage.setItem(TOKEN_KEY, data.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(enrichedUser));
      localStorage.setItem(ORG_KEY, firstOrg.organizationId);

      setToken(data.accessToken);
      setUser(enrichedUser);
    },
    []
  );

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isOwner = user?.role === "OWNER";
  const isAdmin = user?.role === "ADMIN";
  const isUser = user?.role === "MEMBER";

  const canManageMembers = isOwner || isAdmin;
  const canPurgeTasks = isOwner;
  const canSeeAllTasks = isOwner || isAdmin;
  const canSeeLogs = isOwner || isAdmin || isUser;

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, login, logout,
      isOwner, isAdmin, isUser,
      canManageMembers, canPurgeTasks, canSeeAllTasks, canSeeLogs,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
