import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { initAuthFromStorage, login as apiLogin, logout as apiLogout, me as apiMe, type Me } from "@/api/auth";

type AuthState = {
  token: string | null;
  me: Me | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

function isUnauthorized(err: any) {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = initAuthFromStorage();
    setToken(t);

    (async () => {
      try {
        if (!t) return
        try {
          const profile = await apiMe();
          setMe(profile);
        } catch (err) {
          if (isUnauthorized(err)) {
            await apiLogout();
            setToken(null);
            setMe(null);
            return
          }
          throw err;
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const t = await apiLogin(username, password);
      setToken(t);

      try{
        const profile = await apiMe();
        setMe(profile);
      } catch(err){
        await apiLogout();
        setToken(null);
        setMe(null);
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try{
      await apiLogout();
    } catch{} finally {
      localStorage.removeItem("accessToken");
    
    setToken(null);
    setMe(null);
    }
  };

  const refreshMe = async () => {
    if (!token) return;
    try {
      const profile = await apiMe();
      setMe(profile);
    } catch (err) {
      if (isUnauthorized(err)) {
        await apiLogout();
        setToken(null);
        setMe(null);
        return;
      }
      throw err;
    }
  };

  const value = useMemo(() => ({ token, me, loading, login, logout, refreshMe }), [token, me, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthContext missing");
  return v;
}

export function hasAnyPermission(profile: Me | null, perms: string[]) {
  if (!profile) return false;
  if (profile.role === "SUPER_ADMIN" || profile.role === "ADMIN") return true;
  return perms.some((p) => profile.permissions.includes(p as any));
}
