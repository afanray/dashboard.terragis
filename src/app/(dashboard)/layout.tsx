"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Globe, 
  LayoutDashboard, 
  Receipt, 
  UserCheck,
  TrendingUp, 
  Package,
  LogOut, 
  User, 
  ShieldAlert, 
  Database,
  ArrowRight
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userName, userRole, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const isSuperadmin = userRole?.toLowerCase() === "superadmin";

  useEffect(() => {
    const restrictedRoutes = ["/produk", "/products", "/admins"];
    const isRestricted = restrictedRoutes.some(r => pathname === r || pathname.startsWith(r + "/"));
    if (userRole && !isSuperadmin && isRestricted) {
      router.replace("/");
    }
  }, [pathname, userRole, isSuperadmin, router]);

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Ringkasan Dashboard";
      case "/transactions":
        return "Catatan Transaksi";
      case "/subscriptions":
        return "Langganan Pengguna (User Subscriptions)";
      case "/analytics":
        return "Analisis Grafik";
      case "/produk":
      case "/products":
        return "Kelola Produk Billing";
      case "/admins":
        return "Kelola Admin & Peran";
      default:
        return "Terra GIS Dashboard";
    }
  };

  const navItems = [
    { href: "/", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/transactions", label: "Transaksi", icon: Receipt },
    { href: "/subscriptions", label: "Langganan User", icon: UserCheck },
    { href: "/analytics", label: "Analisis", icon: TrendingUp },
    ...(isSuperadmin ? [
      { href: "/produk", label: "Produk Billing", icon: Package },
      { href: "/admins", label: "Kelola Admin", icon: ShieldAlert },
    ] : []),
  ];

  return (
    <div className="relative min-h-screen w-full flex bg-zinc-50 text-zinc-900 font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/3 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-64 w-[450px] h-[450px] bg-indigo-500/3 rounded-full blur-[130px] pointer-events-none" />

      {/* Premium Navigation Sidebar Rail */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`fixed left-0 top-0 h-full z-35 bg-white/85 border-r border-zinc-200/80 backdrop-blur-xl flex flex-col justify-between py-6 transition-all duration-300 ease-in-out select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)]
          ${isSidebarHovered ? "w-60" : "w-16"}`}
      >
        <div className="space-y-8 flex-1">
          {/* Logo & Header */}
          <div className="px-4 flex items-center gap-3 overflow-hidden">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 shrink-0">
              <Globe className="w-5 h-5 text-zinc-950" />
            </div>
            <span className={`font-extrabold tracking-tight text-zinc-900 transition-opacity duration-300 font-display
              ${isSidebarHovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
              TERRA <span className="text-emerald-600">GIS</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer
                    ${isActive 
                      ? "bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold" 
                      : "hover:bg-zinc-100 border border-transparent text-zinc-500 hover:text-zinc-800"}`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-emerald-600" : ""}`} />
                  
                  <span className={`text-sm tracking-wide transition-opacity duration-300 whitespace-nowrap
                    ${isSidebarHovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
                    {item.label}
                  </span>

                  {/* Tooltip in collapsed state */}
                  {!isSidebarHovered && (
                    <div className="absolute left-16 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-semibold text-zinc-800 pointer-events-none transition-all duration-200 shadow-lg whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Elements (User) */}
        <div className="space-y-4 px-2">
          {/* User Profile Info */}
          <div className={`flex items-center gap-3 p-2 rounded-xl bg-zinc-100/60 border border-zinc-200/80 overflow-hidden transition-all duration-300
            ${isSidebarHovered ? "justify-between" : "justify-center"}`}>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-200 flex items-center justify-center border border-zinc-300/80">
                <User className="w-4 h-4 text-zinc-500" />
              </div>
              <div className={`flex flex-col min-w-0 transition-opacity duration-300
                ${isSidebarHovered ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
                <span className="text-xs font-bold truncate max-w-[100px] text-zinc-800">{userName}</span>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md border w-max mt-0.5
                  ${userRole?.toLowerCase() === "superadmin" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" 
                    : "bg-indigo-500/10 border-indigo-500/30 text-indigo-600"}`}>
                  {userRole}
                </span>
              </div>
            </div>

            {isSidebarHovered ? (
              <button 
                onClick={logout}
                title="Log Out"
                className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute left-16 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-red-500 pointer-events-none transition-all duration-200 shadow-lg flex items-center gap-1">
                Logout
                <button onClick={logout} className="ml-1 px-1.5 py-0.5 bg-red-500/20 rounded border border-red-500/20 text-[10px] text-red-600 hover:bg-red-500/30 cursor-pointer">Keluar</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pl-16">


        {/* Top Header */}
        <header className="h-16 border-b border-zinc-200/80 flex items-center justify-between px-8 bg-white/70 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <h2 className="text-lg font-bold font-display text-zinc-800 tracking-wide">{getPageTitle()}</h2>
        </header>

        {/* View Content Port */}
        <main className="flex-1 p-8 overflow-y-auto no-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
