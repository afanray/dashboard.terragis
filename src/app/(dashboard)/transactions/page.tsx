"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { DonationTransaction } from "@/utils/mockData";
import { transactionsApi, productsApi, ProductItem } from "@/utils/api";
import { 
  Search, 
  Filter, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  User,
  Mail,
  Tag,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  FileCode
} from "lucide-react";

export default function TransactionsPage() {
  const { transactions, refetchTransactions, apiConnected, userRole } = useApp();
  
  // State for search and filtering
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<DonationTransaction | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [productsCatalog, setProductsCatalog] = useState<ProductItem[]>([]);

  const isSuperadmin = userRole?.toLowerCase() === "superadmin";
  const itemsPerPage = 10;

  useEffect(() => {
    productsApi.list(false).then((res) => {
      if (res.success && res.data) {
        setProductsCatalog(res.data);
      }
    }).catch(() => {});
  }, []);

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filter options: Combine catalog products with any unique product IDs in transactions
  const productOptions = useMemo(() => {
    const map = new Map<string, string>();
    // Default subscription products
    map.set("terragis_sub_monthly", "Paket Perbulan");
    map.set("terragis_sub_yearly", "Paket Pertahun");
    map.set("terragis_sub_lifetime", "Paket Selamanya");
    map.set("terragis_sub_group", "Paket Bersama (Team)");
    map.set("terragis_sub_trial", "Uji Coba Gratis");

    // Override or add from fetched catalog
    productsCatalog.forEach(p => {
      map.set(p.id, p.title);
    });

    // Add any missing from transactions
    transactions.forEach(tx => {
      if (tx.productId && !map.has(tx.productId)) {
        map.set(tx.productId, tx.name || tx.productId);
      }
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [productsCatalog, transactions]);

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const q = search.toLowerCase();
      const matchesSearch = 
        tx.id.toLowerCase().includes(q) ||
        tx.userName.toLowerCase().includes(q) ||
        tx.userEmail.toLowerCase().includes(q) ||
        (tx.name && tx.name.toLowerCase().includes(q));
        
      const matchesStatus = statusFilter === "All" || tx.status === statusFilter;
      const matchesProduct = productFilter === "All" || tx.productId === productFilter;
      
      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [transactions, search, statusFilter, productFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, productFilter]);

  // Paginated dataset
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredTransactions.slice(start, end);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.max(Math.ceil(filteredTransactions.length / itemsPerPage), 1);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchTransactions();
    setIsRefreshing(false);
  };

  const handleStatusChange = async (txId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      if (apiConnected) {
        await transactionsApi.updateStatus(txId, newStatus);
        await refetchTransactions();
      }
      if (selectedTx) {
        setSelectedTx({ ...selectedTx, status: newStatus as any });
      }
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    setIsExporting(true);
    try {
      await transactionsApi.exportFile(format, statusFilter, productFilter);
    } catch (err: any) {
      alert(`Gagal mengunduh file ekspor: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!isSuperadmin) {
      alert("Akses Diblokir: Hanya Superadmin yang berhak menghapus data transaksi.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus log transaksi ${txId} secara permanen?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await transactionsApi.delete(txId);
      setSelectedTx(null);
      await refetchTransactions();
      alert(`Transaksi ${txId} berhasil dihapus.`);
    } catch (err: any) {
      alert(`Gagal menghapus transaksi: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: DonationTransaction["status"]) => {
    switch (status) {
      case "Success":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[10px] font-bold tracking-wide uppercase">
            <CheckCircle className="w-3 h-3" />
            Success
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold tracking-wide uppercase">
            <Clock className="w-3 h-3 animate-pulse" />
            Pending
          </span>
        );
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-[10px] font-bold tracking-wide uppercase">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-zinc-500 text-[10px] font-bold tracking-wide uppercase">
            <AlertTriangle className="w-3 h-3" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-10rem)]">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display">
            Catatan Transaksi Langganan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Riwayat pembayaran langganan pengguna dari aplikasi mobile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
            Refresh
          </button>
          
          <div className="flex items-center rounded-xl bg-zinc-900 p-0.5 border border-zinc-900">
            <button
              onClick={() => handleExport("csv")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white hover:bg-zinc-800 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Export CSV File"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <div className="w-[1px] h-4 bg-zinc-700 mx-0.5" />
            <button
              onClick={() => handleExport("json")}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-white hover:bg-zinc-800 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Export JSON File"
            >
              <FileCode className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel-light p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm bg-white/80 backdrop-blur-md border border-zinc-200">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID, pengguna, atau email..."
            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 transition-colors focus:ring-1 focus:ring-emerald-500/25"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-650 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              suppressHydrationWarning
              className="bg-transparent text-xs text-zinc-650 focus:outline-none pr-2 cursor-pointer font-medium"
            >
              <option className="text-zinc-800" value="All" suppressHydrationWarning>Semua Status</option>
              <option className="text-zinc-800" value="Success" suppressHydrationWarning>Success</option>
              <option className="text-zinc-800" value="Pending" suppressHydrationWarning>Pending</option>
              <option className="text-zinc-800" value="Failed" suppressHydrationWarning>Failed</option>
              <option className="text-zinc-800" value="Cancelled" suppressHydrationWarning>Cancelled</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Tag className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-650 focus:outline-none pr-2 cursor-pointer font-medium"
            >
              <option className="text-zinc-800" value="All">Semua Paket</option>
              {productOptions.map(p => (
                <option key={p.id} className="text-zinc-800" value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Data Table */}
      <div className="glass-panel-light rounded-2xl overflow-hidden shadow-md border border-zinc-200 bg-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] tracking-wider uppercase font-bold text-zinc-500">
                <th className="py-4 px-6">ID / Tanggal</th>
                <th className="py-4 px-6">Pengguna</th>
                <th className="py-4 px-6">Paket Langganan</th>
                <th className="py-4 px-6 text-right">Nominal</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150/70 text-xs text-zinc-650">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => {
                  const txDate = new Date(tx.createdAt);
                  const dateString = isNaN(txDate.getTime()) ? tx.createdAt : txDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTx(tx)}
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <span className="font-bold text-zinc-800 group-hover:text-emerald-600 transition-colors flex items-center gap-1 font-mono text-[11px]">
                            {tx.id}
                            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                          <span className="text-[10px] text-zinc-400 font-semibold">{dateString}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-zinc-700">{tx.userName}</span>
                          <span className="block text-[10px] text-zinc-450 truncate max-w-[150px] md:max-w-[200px]">
                            {tx.userEmail}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-zinc-700">
                        <div className="flex flex-col">
                          <span>{tx.name || tx.productId}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">{tx.productId}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-zinc-900 font-display">
                        {formatIDR(tx.amount)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {getStatusBadge(tx.status)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 font-medium">
                    Tidak menemukan transaksi yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-zinc-50 border-t border-zinc-200 px-6 py-4 flex items-center justify-between">
          <span className="text-[10px] text-zinc-450 font-bold uppercase tracking-wider">
            Menampilkan {filteredTransactions.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
            {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} Log
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-white text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-zinc-700 px-2 select-none">
              Hal {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-30 disabled:hover:bg-white text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Detail Slide-out Drawer */}
      {selectedTx && (
        <>
          {/* Overlay mask */}
          <div 
            onClick={() => setSelectedTx(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity animate-fade-in"
          />

          {/* Drawer container */}
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-zinc-250 z-50 p-6 flex flex-col justify-between shadow-2xl animate-scale-in text-zinc-800 overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Detail Audit Transaksi</h3>
                  <h2 className="text-base font-extrabold text-zinc-900 mt-0.5 font-mono">{selectedTx.id}</h2>
                </div>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Transaction Metrics Card */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-zinc-200/50 pointer-events-none">
                  <CreditCard className="w-16 h-16" />
                </div>
                <span className="text-[9px] font-bold text-zinc-450 tracking-widest uppercase">NOMINAL TRANSAKSI</span>
                <p className="text-2xl font-black text-zinc-900 font-display">{formatIDR(selectedTx.amount)}</p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-semibold">Status Pembayaran:</span>
                  {getStatusBadge(selectedTx.status)}
                </div>
              </div>

              {/* Status Update Control */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Ubah Status Transaksi (API):</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleStatusChange(selectedTx.id, "Success")}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Set Success
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedTx.id, "Pending")}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 hover:bg-amber-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Set Pending
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedTx.id, "Failed")}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-2 bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Set Failed
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedTx.id, "Cancelled")}
                    disabled={isUpdatingStatus}
                    className="py-1.5 px-2 bg-zinc-500/10 border border-zinc-500/20 text-zinc-600 hover:bg-zinc-500/20 rounded-lg text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Set Cancelled
                  </button>
                </div>
              </div>

              {/* Metadata Fields */}
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-zinc-400" />
                    Nama Pengguna
                  </span>
                  <p className="font-semibold text-zinc-800">{selectedTx.userName}</p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-zinc-400" />
                    Email
                  </span>
                  <p className="font-medium text-zinc-700 select-all">{selectedTx.userEmail}</p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-zinc-400" />
                    Paket Langganan
                  </span>
                  <p className="font-semibold text-zinc-800">{selectedTx.name || selectedTx.productId}</p>
                  <p className="text-[10px] font-mono text-zinc-400">{selectedTx.productId}</p>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    Waktu Transaksi
                  </span>
                  <p className="font-medium text-zinc-700">
                    {new Date(selectedTx.createdAt).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      dateStyle: "full",
                      timeStyle: "medium"
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-zinc-200 mt-6 space-y-2">
              {isSuperadmin && (
                <button
                  onClick={() => handleDeleteTransaction(selectedTx.id)}
                  disabled={isDeleting}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-200/60 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? "Menghapus..." : "Hapus Transaksi (Permanen)"}
                </button>
              )}
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
