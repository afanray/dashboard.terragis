"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { subscriptionsApi, UserSubscriptionItem, UserSubscriptionStats, productsApi, ProductItem } from "@/utils/api";
import {
  Search,
  RefreshCw,
  Download,
  Calendar,
  User,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  CreditCard,
  Sparkles,
  Users,
  ExternalLink,
  ChevronDown,
  X
} from "lucide-react";

export default function SubscriptionsPage() {
  const { userRole } = useApp();
  const isSuperadmin = userRole?.toLowerCase() === "superadmin";

  // Data states
  const [subscriptions, setSubscriptions] = useState<UserSubscriptionItem[]>([]);
  const [stats, setStats] = useState<UserSubscriptionStats>({
    total: 0,
    active: 0,
    queued: 0,
    expired: 0,
    cancelled: 0,
  });
  const [productsCatalog, setProductsCatalog] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination & Filtering
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal & Action
  const [selectedSub, setSelectedSub] = useState<UserSubscriptionItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    showToast(`${label} disalin ke clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch Products Catalog for filter
  useEffect(() => {
    productsApi.list(false).then((res) => {
      if (res.success && res.data) {
        setProductsCatalog(res.data);
      }
    }).catch(() => {});
  }, []);

  // Fetch Subscriptions & Stats
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setIsRefreshing(true);

    try {
      const [listRes, statsRes] = await Promise.allSettled([
        subscriptionsApi.list({
          q: search.trim() || undefined,
          status: statusFilter !== "All" ? statusFilter : undefined,
          productId: productFilter !== "All" ? productFilter : undefined,
          page: currentPage,
          pageSize: pageSize,
          sortBy: "created_at",
          order: "desc",
        }),
        subscriptionsApi.getStats()
      ]);

      if (listRes.status === "fulfilled" && listRes.value.success) {
        setSubscriptions(listRes.value.data || []);
        if (listRes.value.meta) {
          setTotalItems(listRes.value.meta.total);
          setTotalPages(listRes.value.meta.total_pages || 1);
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value.success && statsRes.value.data) {
        setStats(statsRes.value.data);
      }
    } catch (err: any) {
      console.error("Gagal memuat daftar langganan user:", err);
      showToast("Gagal menyinkronkan data dengan server.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [search, statusFilter, productFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format IDR Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format Date in Indonesian locale
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // Remaining days calculation
  const getRemainingDays = (endDateStr?: string | null) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr).getTime();
    const now = new Date().getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Status Badge Component
  const renderStatusBadge = (status: string, endDateStr?: string | null) => {
    const s = (status || "").toLowerCase();
    const daysLeft = getRemainingDays(endDateStr);

    if (s === "active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Aktif
          {daysLeft !== null && daysLeft > 0 && (
            <span className="text-[10px] text-emerald-600 font-normal opacity-90">
              ({daysLeft} hari)
            </span>
          )}
        </span>
      );
    }
    if (s === "queued") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-500" />
          Antrean
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-500" />
          Dibatalkan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200">
        <AlertCircle className="w-3 h-3 text-zinc-400" />
        Kadaluarsa
      </span>
    );
  };

  // Billing Period Label & Badge
  const renderPeriodBadge = (period: string) => {
    const p = (period || "").toLowerCase();
    switch (p) {
      case "monthly":
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 rounded-md">Bulanan</span>;
      case "yearly":
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100 rounded-md">Tahunan</span>;
      case "lifetime":
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-100 rounded-md">Selamanya</span>;
      case "group":
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-100 rounded-md">Paket Tim</span>;
      case "trial":
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 rounded-md">Uji Coba</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium bg-zinc-100 text-zinc-600 rounded-md">{period}</span>;
    }
  };

  // Handle Export
  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      await subscriptionsApi.exportFile(
        format,
        search.trim() || undefined,
        statusFilter !== "All" ? statusFilter : undefined,
        productFilter !== "All" ? productFilter : undefined
      );
      showToast(`Berhasil mengekspor data langganan (.${format})`);
    } catch (err: any) {
      showToast(err.message || "Gagal mengekspor file.");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (subId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await subscriptionsApi.updateStatus(subId, newStatus);
      if (res.success && res.data) {
        setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, status: newStatus } : s));
        if (selectedSub && selectedSub.id === subId) {
          setSelectedSub(prev => prev ? { ...prev, status: newStatus } : null);
        }
        showToast("Status langganan berhasil diperbarui!");
        fetchData(true);
      }
    } catch (err: any) {
      showToast(err.message || "Gagal memperbarui status langganan.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Product Filter Options
  const productFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    map.set("terragis_sub_monthly", "Paket Perbulan");
    map.set("terragis_sub_yearly", "Paket Pertahun");
    map.set("terragis_sub_lifetime", "Paket Selamanya");
    map.set("terragis_sub_group", "Paket Bersama (5 User)");
    map.set("terragis_sub_trial", "Uji Coba Gratis");

    productsCatalog.forEach(p => {
      map.set(p.id, p.title);
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [productsCatalog]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-900 text-white text-sm font-medium shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Manajemen Langganan
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display text-zinc-900 tracking-tight">
            Langganan Pengguna (User Subscriptions)
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Pantau status langganan, paket pengguna, masa aktif, serta riwayat aktivasi akun Terra GIS.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchData()}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
            <span>Sinkronkan</span>
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={isExporting || subscriptions.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Ekspor CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => handleExport("json")}
            disabled={isExporting || subscriptions.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
            title="Ekspor JSON"
          >
            <Download className="w-3.5 h-3.5 text-emerald-100" />
            <span>Ekspor JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscriptions */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Langganan</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-600 border border-zinc-200/60">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-zinc-900 tracking-tight font-display">
              {stats.total.toLocaleString("id-ID")}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Akun tercatat dalam sistem</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-zinc-200/30 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 2: Active Subscriptions */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-emerald-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Langganan Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-600 tracking-tight font-display">
              {stats.active.toLocaleString("id-ID")}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Dapat mengakses layanan Terra GIS</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 3: Queued Subscriptions */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-amber-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Dalam Antrean (Queued)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight font-display">
              {stats.queued.toLocaleString("id-ID")}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Aktif setelah paket sekarang selesai</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Card 4: Expired Subscriptions */}
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-zinc-200/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Berakhir / Expired</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-500 border border-zinc-200/60">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-zinc-700 tracking-tight font-display">
              {stats.expired.toLocaleString("id-ID")}
            </span>
            <p className="text-xs text-zinc-500 mt-1">Periode aktif telah selesai</p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan User ID, Nama Pengguna, Email, atau Paket..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Status Filter */}
            <div className="relative min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="All">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="queued">Antrean (Queued)</option>
                <option value="expired">Berakhir (Expired)</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Product / Plan Filter */}
            <div className="relative min-w-[170px]">
              <select
                value={productFilter}
                onChange={(e) => {
                  setProductFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer shadow-2xs"
              >
                <option value="All">Semua Paket</option>
                {productFilterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Filter Button */}
            {(search || statusFilter !== "All" || productFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setProductFilter("All");
                  setCurrentPage(1);
                }}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-zinc-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/70 text-[11px] font-bold uppercase tracking-wider text-zinc-500 select-none">
                <th className="py-3.5 px-4">User ID</th>
                <th className="py-3.5 px-4">Nama Pengguna</th>
                <th className="py-3.5 px-4">Paket Berlangganan</th>
                <th className="py-3.5 px-4">Mulai Berlangganan</th>
                <th className="py-3.5 px-4">Akhir Berlangganan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Nominal</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {loading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 bg-zinc-200 rounded w-24" /></td>
                    <td className="py-4 px-4">
                      <div className="h-4 bg-zinc-200 rounded w-32 mb-1" />
                      <div className="h-3 bg-zinc-100 rounded w-20" />
                    </td>
                    <td className="py-4 px-4"><div className="h-4 bg-zinc-200 rounded w-28" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-zinc-200 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-zinc-200 rounded w-24" /></td>
                    <td className="py-4 px-4"><div className="h-5 bg-zinc-200 rounded-full w-16" /></td>
                    <td className="py-4 px-4"><div className="h-4 bg-zinc-200 rounded w-20" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-6 bg-zinc-200 rounded w-12 mx-auto" /></td>
                  </tr>
                ))
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-200/60">
                        <Users className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-zinc-800">Tidak ada langganan ditemukan</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        {search || statusFilter !== "All" || productFilter !== "All"
                          ? "Coba sesuaikan kata kunci pencarian atau reset filter yang dipilih."
                          : "Belum ada catatan langganan pengguna yang tersimpan di sistem."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const userName = sub.user_name || sub.userName || "Tanpa Nama";
                  const userEmail = sub.user_email || sub.userEmail || "-";
                  const productTitle = sub.product_title || sub.productTitle || sub.product_id;
                  const startDateStr = sub.start_date || sub.startDate;
                  const endDateStr = sub.end_date || sub.endDate;
                  const billingPeriod = sub.billing_period || sub.billingPeriod || "monthly";

                  return (
                    <tr 
                      key={sub.id} 
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
                      {/* 1. User ID Column */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <code 
                            title={sub.user_id}
                            className="text-xs font-mono bg-zinc-100 text-zinc-700 px-2 py-1 rounded-md border border-zinc-200/80 font-medium select-all"
                          >
                            {sub.user_id.slice(0, 8)}...{sub.user_id.slice(-4)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(sub.user_id, "User ID")}
                            title="Salin User ID Lengkap"
                            className="p-1 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                          >
                            {copiedId === sub.user_id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. Nama Pengguna & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-800 truncate max-w-[180px]">
                              {userName}
                            </p>
                            <p className="text-xs text-zinc-400 truncate max-w-[180px]">
                              {userEmail}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 3. Paket Berlangganan */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-zinc-800 text-xs">
                            {productTitle}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {renderPeriodBadge(billingPeriod)}
                            {sub.payment_method && (
                              <span className="text-[10px] text-zinc-400 uppercase font-mono">
                                • {sub.payment_method}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4. Mulai Berlangganan */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-zinc-600 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{formatDate(startDateStr)}</span>
                        </div>
                      </td>

                      {/* 5. Akhir Berlangganan */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 text-zinc-700 text-xs font-semibold">
                            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span>{formatDate(endDateStr)}</span>
                          </div>
                          {getRemainingDays(endDateStr) !== null && (
                            <span className={`text-[10px] font-medium ml-5 ${
                              (getRemainingDays(endDateStr) ?? 0) <= 0 
                                ? "text-rose-500" 
                                : (getRemainingDays(endDateStr) ?? 0) <= 7 
                                ? "text-amber-600" 
                                : "text-emerald-600"
                            }`}>
                              {(getRemainingDays(endDateStr) ?? 0) <= 0 
                                ? "Sudah Berakhir" 
                                : `Sisa ${getRemainingDays(endDateStr)} hari`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4">
                        {renderStatusBadge(sub.status, endDateStr)}
                      </td>

                      {/* 7. Nominal */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-800 text-xs">
                          {sub.amount > 0 ? formatIDR(sub.amount) : "Gratis / Tim"}
                        </div>
                      </td>

                      {/* 8. Aksi */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition cursor-pointer"
                          title="Lihat Detail & Kelola"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="border-t border-zinc-200/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-50/50">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              Menampilkan <span className="font-semibold text-zinc-800">{subscriptions.length}</span> dari{" "}
              <span className="font-semibold text-zinc-800">{totalItems}</span> langganan
            </span>

            <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-3">
              <span>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-zinc-200 rounded-md px-2 py-1 text-xs font-semibold text-zinc-700 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 disabled:opacity-40 transition cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-zinc-700 px-3 py-1 bg-white border border-zinc-200 rounded-lg">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-600 disabled:opacity-40 transition cursor-pointer"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            className="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-200/80 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">Detail Langganan Pengguna</h3>
                  <p className="text-xs text-zinc-400 font-mono">ID: {selectedSub.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* User Identity Box */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Informasi Pengguna</span>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm">
                      {(selectedSub.user_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">{selectedSub.user_name || "Tanpa Nama"}</p>
                      <p className="text-xs text-zinc-500">{selectedSub.user_email || "Tidak ada email"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">User ID</span>
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-zinc-200 text-zinc-800">
                      {selectedSub.user_id}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedSub.user_id, "User ID")}
                      className="p-1 hover:bg-zinc-200 rounded text-zinc-500 transition"
                      title="Salin User ID"
                    >
                      {copiedId === selectedSub.user_id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Subscription Timeline & Status Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Mulai Berlangganan</span>
                  <p className="text-xs font-bold text-zinc-800 pt-1">
                    {formatDate(selectedSub.start_date || selectedSub.startDate)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Akhir Berlangganan</span>
                  <p className="text-xs font-bold text-zinc-800 pt-1">
                    {formatDate(selectedSub.end_date || selectedSub.endDate)}
                  </p>
                  {getRemainingDays(selectedSub.end_date || selectedSub.endDate) !== null && (
                    <p className={`text-[10px] font-semibold ${
                      (getRemainingDays(selectedSub.end_date || selectedSub.endDate) ?? 0) > 0 
                        ? "text-emerald-600" 
                        : "text-rose-500"
                    }`}>
                      {(getRemainingDays(selectedSub.end_date || selectedSub.endDate) ?? 0) > 0
                        ? `Sisa ${getRemainingDays(selectedSub.end_date || selectedSub.endDate)} hari`
                        : "Kadaluarsa"}
                    </p>
                  )}
                </div>
              </div>

              {/* Package and Billing Details */}
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Rincian Paket & Pembayaran</span>
                <div className="grid grid-cols-2 gap-y-3 text-xs">
                  <div>
                    <span className="text-zinc-400">Nama Paket</span>
                    <p className="font-semibold text-zinc-800 mt-0.5">
                      {selectedSub.product_title || selectedSub.productTitle || selectedSub.product_id}
                    </p>
                  </div>

                  <div>
                    <span className="text-zinc-400">Product ID</span>
                    <p className="font-mono text-zinc-700 mt-0.5 text-[11px]">
                      {selectedSub.product_id}
                    </p>
                  </div>

                  <div>
                    <span className="text-zinc-400">Periode Penagihan</span>
                    <div className="mt-0.5">
                      {renderPeriodBadge(selectedSub.billing_period || selectedSub.billingPeriod || "monthly")}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-400">Nominal Langganan</span>
                    <p className="font-semibold text-zinc-800 mt-0.5">
                      {selectedSub.amount > 0 ? formatIDR(selectedSub.amount) : "Rp 0 (Uji Coba / Tim)"}
                    </p>
                  </div>

                  <div>
                    <span className="text-zinc-400">Metode Pembayaran</span>
                    <p className="font-semibold text-zinc-800 uppercase mt-0.5">
                      {selectedSub.payment_method || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-zinc-400">Status Saat Ini</span>
                    <div className="mt-0.5">
                      {renderStatusBadge(selectedSub.status, selectedSub.end_date || selectedSub.endDate)}
                    </div>
                  </div>

                  {selectedSub.transaction_id && (
                    <div className="col-span-2 pt-2 border-t border-zinc-200/60">
                      <span className="text-zinc-400">Transaction ID</span>
                      <p className="font-mono text-zinc-800 text-[11px] mt-0.5">
                        {selectedSub.transaction_id}
                      </p>
                    </div>
                  )}

                  {selectedSub.group_id && (
                    <div className="col-span-2 pt-2 border-t border-zinc-200/60">
                      <span className="text-zinc-400">Group ID (Paket Bersama)</span>
                      <p className="font-mono text-zinc-800 text-[11px] mt-0.5">
                        {selectedSub.group_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Control */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Ubah Status Langganan</h4>
                    <p className="text-[11px] text-zinc-500">Pilih status baru untuk memperbarui akses pengguna ini.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    defaultValue={selectedSub.status}
                    id="statusSelect"
                    className="flex-1 bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="active">Aktif (Active)</option>
                    <option value="queued">Antrean (Queued)</option>
                    <option value="expired">Berakhir (Expired)</option>
                    <option value="cancelled">Dibatalkan (Cancelled)</option>
                  </select>

                  <button
                    disabled={isUpdatingStatus}
                    onClick={() => {
                      const select = document.getElementById("statusSelect") as HTMLSelectElement;
                      if (select && select.value) {
                        handleUpdateStatus(selectedSub.id, select.value);
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
