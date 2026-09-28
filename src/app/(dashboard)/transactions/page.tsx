"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { DonationTransaction } from "@/utils/mockData";
import { transactionsApi } from "@/utils/api";
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

  const isSuperadmin = userRole?.toLowerCase() === "superadmin";
  const itemsPerPage = 10;

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filtered dataset
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = 
        tx.id.toLowerCase().includes(search.toLowerCase()) ||
        tx.userName.toLowerCase().includes(search.toLowerCase()) ||
        tx.userEmail.toLowerCase().includes(search.toLowerCase());
        
      const matchesStatus = statusFilter === "All" || tx.status === statusFilter;
      const matchesProduct = productFilter === "All" || tx.productId === productFilter;
      
      return matchesSearch && matchesStatus && matchesProduct;
    });
  }, [transactions, search, statusFilter, productFilter]);

  // Reset page when filters change
  React.useEffect(() => {
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
            Catatan Transaksi Dukungan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gunakan filter dan kolom pencarian untuk menyaring logs pembayaran. Klik baris tabel untuk melihat detail audit.
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
            placeholder="Cari ID, nama, atau email..."
            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-emerald-500/50 transition-colors focus:ring-1 focus:ring-emerald-500/25"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
          {search && (
            <button 
              onClick={() => setSearch("")} 
              className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-650"
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
              <option className="text-zinc-800" value="All">Semua Produk</option>
              <option className="text-zinc-800" value="support_10000">Dukungan Rp10.000</option>
              <option className="text-zinc-800" value="support_25000">Dukungan Rp25.000</option>
              <option className="text-zinc-800" value="support_50000">Dukungan Rp50.000</option>
              <option className="text-zinc-800" value="support_100000">Dukungan Rp100.000</option>
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
                <th className="py-4 px-6">Produk Billing</th>
                <th className="py-4 px-6 text-right">Nominal</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150/70 text-xs text-zinc-650">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((tx) => {
                  const txDate = new Date(tx.createdAt);
                  const dateString = txDate.toLocaleDateString("id-ID", {
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
                          <span className="font-bold text-zinc-800 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
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
                      <td className="py-4 px-6 font-medium text-zinc-600">
                        {tx.name}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-zinc-900">
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
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-zinc-250 z-50 p-6 flex flex-col justify-between shadow-2xl animate-scale-in text-zinc-800">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-200">
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Detail Audit Transaksi</h3>
                  <h2 className="text-lg font-extrabold text-zinc-900 mt-0.5">{selectedTx.id}</h2>
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
                <span className="text-[9px] font-bold text-zinc-450 tracking-widest uppercase">JUMLAH DUKUNGAN</span>
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

              {/* Data Audit List */}
              <div className="space-y-4 text-xs">
                {/* User Details */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase">IDENTITAS PENGGUNA</span>
                  <div className="space-y-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <div className="flex items-center gap-2.5">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="font-semibold text-zinc-700">{selectedTx.userName}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-650 font-medium select-all truncate">{selectedTx.userEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Billing Details */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase">METADATA GOOGLE PLAY</span>
                  <div className="space-y-2.5 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                    <div className="flex justify-between animate-fade-in">
                      <span className="text-zinc-500 font-medium flex items-center gap-1.5"><Tag className="w-3 h-3" /> Product ID:</span>
                      <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-zinc-200 text-emerald-600 font-mono">{selectedTx.productId}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-medium flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Waktu Transaksi:</span>
                      <span className="text-zinc-700 font-semibold">{new Date(selectedTx.createdAt).toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Block */}
            <div className="pt-4 border-t border-zinc-200 space-y-2">
              <a
                href={`mailto:${selectedTx.userEmail}`}
                className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
              >
                Kirim Email Konfirmasi
              </a>

              {/* Superadmin Delete Button */}
              {isSuperadmin && (
                <button
                  onClick={() => handleDeleteTransaction(selectedTx.id)}
                  disabled={isDeleting}
                  className="w-full py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? "Menghapus..." : "Hapus Transaksi (Superadmin Only)"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
