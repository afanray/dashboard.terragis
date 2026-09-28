"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DonationTransaction, generateMockTransactions } from "@/utils/mockData";
import { authApi, transactionsApi } from "@/utils/api";
import { 
  signInWithPopup, 
  signOut as fbSignOut, 
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
} from "firebase/firestore";
import { auth, db, googleProvider, isConfigured as isFbConfigured } from "@/utils/firebase";

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  userName: string;
  setUserName: (v: string) => void;
  userRole: string;
  setUserRole: (v: string) => void;
  transactions: DonationTransaction[];
  loginWithApi: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  firebaseConfigured: boolean;
  apiConnected: boolean;
  refetchTransactions: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const [userRole, setUserRole] = useState("admin");
  const [transactions, setTransactions] = useState<DonationTransaction[]>([]);
  const [apiConnected, setApiConnected] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchBackendTransactions = useCallback(async () => {
    try {
      const res = await transactionsApi.list({ pageSize: 1000 });
      if (res.success && res.data && res.data.length > 0) {
        setTransactions(res.data as DonationTransaction[]);
        setApiConnected(true);
      } else if (res.success && res.data && res.data.length === 0) {
        setTransactions([]);
        setApiConnected(true);
      }
    } catch (err) {
      console.warn("FastAPI backend transactions fetch offline/failed, falling back to mock dataset", err);
      setApiConnected(false);
      setTransactions(generateMockTransactions());
    }
  }, []);

  // Handle auto-login / check session on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const savedLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const savedUser = localStorage.getItem("userName") || "Guest";
    const savedRole = localStorage.getItem("userRole") || "admin";

    if (token) {
      // Validate session with FastAPI backend
      authApi.getMe()
        .then((res) => {
          if (res.success && res.data) {
            const role = res.data.role?.toLowerCase() || "user";
            if (role !== "admin" && role !== "superadmin") {
              authApi.logout();
              setIsLoggedIn(false);
              setUserName("Guest");
              setUserRole("user");
              if (pathname !== "/login") {
                router.push("/login");
              }
              return;
            }
            setIsLoggedIn(true);
            setUserName(res.data.name);
            setUserRole(role);
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userName", res.data.name);
            localStorage.setItem("userRole", role);
            setApiConnected(true);
          }
        })
        .catch(() => {
          // Token expired or invalid
          authApi.logout();
          setIsLoggedIn(false);
          setUserName("Guest");
          setUserRole("admin");
          if (pathname !== "/login") {
            router.push("/login");
          }
        });
    } else if (savedLoggedIn) {
      setIsLoggedIn(true);
      setUserName(savedUser);
      setUserRole(savedRole.toLowerCase());
    } else {
      if (pathname !== "/login") {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  // Sync transactions from FastAPI backend
  useEffect(() => {
    if (isLoggedIn) {
      fetchBackendTransactions();
      const interval = setInterval(fetchBackendTransactions, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchBackendTransactions]);

  const loginWithApi = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.success) {
      setIsLoggedIn(true);
      const profile = await authApi.getMe();
      const role = (profile.data?.role || "admin").toLowerCase();
      if (role !== "admin" && role !== "superadmin") {
        authApi.logout();
        throw new Error("Akses Ditolak: Hanya akun berstatus Administrator/Superadmin yang diizinkan mengakses Dashboard.");
      }
      const name = profile.data?.name || email;
      setUserName(name);
      setUserRole(role);
      localStorage.setItem("userName", name);
      localStorage.setItem("userRole", role);
      router.push("/");
    }
  };

  const loginWithGoogle = async () => {
    if (!isFbConfigured || !auth || !googleProvider) {
      throw new Error("Koneksi Firebase offline. Silakan gunakan Login Administrator.");
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      if (fbUser) {
        const idToken = await fbUser.getIdToken();
        try {
          // Authenticate with FastAPI backend using Google SSO ID token
          await authApi.loginGoogle(idToken, fbUser.email || undefined, fbUser.displayName || undefined);
          const profile = await authApi.getMe();
          const role = (profile.data?.role || "user").toLowerCase();
          
          if (role !== "admin" && role !== "superadmin") {
            // Check fallback in Firestore admins collection
            const adminDocRef = doc(db, "admins", fbUser.uid);
            const adminDoc = await getDoc(adminDocRef);
            if (adminDoc.exists() && adminDoc.data().isActive === true) {
              const name = adminDoc.data().name || fbUser.displayName || fbUser.email || "Admin";
              localStorage.setItem("isLoggedIn", "true");
              localStorage.setItem("userName", name);
              localStorage.setItem("userRole", "superadmin");
              setIsLoggedIn(true);
              setUserName(name);
              setUserRole("superadmin");
              router.push("/");
              return;
            }

            authApi.logout();
            await fbSignOut(auth);
            throw new Error("Akses Ditolak: Akun Google Anda belum terdaftar sebagai Administrator/Superadmin aktif.");
          }

          const name = profile.data?.name || fbUser.displayName || fbUser.email || "Admin";
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("userName", name);
          localStorage.setItem("userRole", role);
          setIsLoggedIn(true);
          setUserName(name);
          setUserRole(role);
          router.push("/");
        } catch (backendErr: any) {
          if (backendErr.message?.includes("Akses Ditolak")) {
            throw backendErr;
          }
          // Fallback if backend /auth/google is unreachable
          const adminDocRef = doc(db, "admins", fbUser.uid);
          const adminDoc = await getDoc(adminDocRef);
          
          if (adminDoc.exists() && adminDoc.data().isActive === true) {
            const name = adminDoc.data().name || fbUser.displayName || fbUser.email || "Admin";
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("userName", name);
            localStorage.setItem("userRole", "superadmin");
            setIsLoggedIn(true);
            setUserName(name);
            setUserRole("superadmin");
            router.push("/");
          } else {
            await fbSignOut(auth);
            throw new Error(backendErr.message || "Akun Google Anda tidak terdaftar sebagai Administrator aktif.");
          }
        }
      }
    } catch (error: any) {
      console.error("Google login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    authApi.logout();
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setUserName("Guest");
    setUserRole("admin");
    
    if (isFbConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.error("Error signing out from Firebase:", e);
      }
    }
    router.push("/login");
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        userName,
        setUserName,
        userRole,
        setUserRole,
        transactions,
        loginWithApi,
        loginWithGoogle,
        logout,
        firebaseConfigured: isFbConfigured,
        apiConnected,
        refetchTransactions: fetchBackendTransactions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
