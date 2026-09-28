"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { analyticsApi } from "@/utils/api";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
} from "recharts";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar,
  AlertCircle,
  Tag,
  Briefcase
} from "lucide-react";

export default function AnalyticsPage() {
  const { transactions } = useApp();
  const [isMounted, setIsMounted] = useState(false);
  const [backendMonthly, setBackendMonthly] = useState<Array<{
    month: string;
    year: number;
    totalSupport: number;
    totalCount: number;
  }> | null>(null);

  const [backendProducts, setBackendProducts] = useState<Array<{
    productId: string;
    label: string;
    count: number;
    sum: number;
  }> | null>(null);

  const [backendStatus, setBackendStatus] = useState<Array<{
    status: string;
    count: number;
    percentage: number;
  }> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    analyticsApi.getMonthlyTrends().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setBackendMonthly(res.data);
      }
    }).catch(() => {});

    analyticsApi.getProductStats().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setBackendProducts(res.data);
      }
    }).catch(() => {});

    analyticsApi.getStatusDistribution().then(res => {
      if (res.success && res.data && res.data.length > 0) {
        setBackendStatus(res.data);
      }
    }).catch(() => {});
  }, [transactions]);

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // 1. Monthly Successful Support Trend
  const monthlyData = useMemo(() => {
    if (backendMonthly && backendMonthly.length > 0) {
      return backendMonthly.map(item => ({
        name: `${item.month} ${item.year}`,
        "Total Nominal": item.totalSupport,
      }));
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const counts = Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    
    transactions
      .filter(tx => tx.status === "Success")
      .forEach(tx => {
        const date = new Date(tx.createdAt);
        if (!isNaN(date.getTime()) && date.getFullYear() === currentYear) {
          counts[date.getMonth()] += tx.amount;
        }
      });
      
    return months.map((m, idx) => ({
      name: m,
      "Total Nominal": counts[idx],
    }));
  }, [backendMonthly, transactions]);

  // 2. Product Distribution Count
  const productData = useMemo(() => {
    if (backendProducts && backendProducts.length > 0) {
      return backendProducts.map(p => ({
        name: p.label,
        "Jumlah Transaksi": p.count,
      }));
    }

    const map = new Map<string, number>();
    transactions
      .filter(tx => tx.status === "Success")
      .forEach(tx => {
        const label = tx.name || tx.productId;
        map.set(label, (map.get(label) || 0) + 1);
      });

    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      "Jumlah Transaksi": count,
    }));
  }, [backendProducts, transactions]);

  // 3. Status outcomes proportion
  const statusData = useMemo(() => {
    if (backendStatus && backendStatus.length > 0) {
      const colorMap: Record<string, string> = {
        Success: "#10b981",
        Pending: "#f5a623",
        Failed: "#ef4444",
        Cancelled: "#71717a",
      };

      return backendStatus.map(s => ({
        name: s.status,
        value: s.count,
        color: colorMap[s.status] || "#6366f1",
      }));
    }

    const counts: Record<string, number> = {
      Success: 0,
      Pending: 0,
      Failed: 0,
      Cancelled: 0,
    };
    
    transactions.forEach(tx => {
      if (tx.status in counts) {
        counts[tx.status]++;
      }
    });
    
    return [
      { name: "Success", value: counts.Success, color: "#10b981" },
      { name: "Pending", value: counts.Pending, color: "#f5a623" },
      { name: "Failed", value: counts.Failed, color: "#ef4444" },
      { name: "Cancelled", value: counts.Cancelled, color: "#71717a" },
    ];
  }, [backendStatus, transactions]);

  // 4. Product Statistics Details Table Data
  const productStatsTable = useMemo(() => {
    if (backendProducts && backendProducts.length > 0) {
      return backendProducts.map(p => ({
        id: p.productId,
        name: p.label,
        count: p.count,
        total: p.sum,
      }));
    }

    const stats: Record<string, { name: string; count: number; total: number }> = {};
    transactions
      .filter(tx => tx.status === "Success")
      .forEach(tx => {
        const id = tx.productId || "unknown";
        if (!stats[id]) {
          stats[id] = { name: tx.name || id, count: 0, total: 0 };
        }
        stats[id].count++;
        stats[id].total += tx.amount;
      });

    return Object.entries(stats).map(([id, val]) => ({
      id,
      ...val,
    }));
  }, [backendProducts, transactions]);

  // Render placeholder if component is rendering on server
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-zinc-200/50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-zinc-200/50 rounded-2xl animate-pulse" />
          <div className="h-80 bg-zinc-200/50 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const hasData = transactions.length > 0 || (backendMonthly && backendMonthly.length > 0);

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display">
          Analisis Grafik & Performa
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Visualisasi grafis tren nominal pendapatan, segmentasi paket langganan, dan proporsi rasio penyelesaian transaksi.
        </p>
      </div>

      {!hasData && (
        <div className="glass-panel-light p-8 rounded-2xl text-center space-y-3 bg-white border border-zinc-200">
          <AlertCircle className="w-12 h-12 text-zinc-400 mx-auto" />
          <h2 className="text-lg font-bold text-zinc-800">Tidak Ada Data Transaksi</h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Data transaksi dari database live akan muncul di sini secara otomatis setelah transaksi pertama terproses.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Support Trend Line Chart */}
            <div className="glass-panel-light p-6 rounded-2xl space-y-4 shadow-sm bg-white border border-zinc-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2 tracking-tight">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Tren Nominal Pendapatan Bulanan
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Akumulasi pembayaran sukses per bulan</p>
                </div>
                <Calendar className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="h-72 w-full pr-4 text-xs font-semibold select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tickLine={false} />
                    <YAxis 
                      stroke="#71717a" 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => `Rp${(v / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", borderRadius: "12px" }}
                      formatter={(v: any) => [formatIDR(Number(v)), "Total Nominal"]}
                      labelStyle={{ color: "#27272a", fontWeight: "bold" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Total Nominal" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Nominal Distribution Bar Chart */}
            <div className="glass-panel-light p-6 rounded-2xl space-y-4 shadow-sm bg-white border border-zinc-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2 tracking-tight">
                    <BarChart3 className="w-4 h-4 text-indigo-650" />
                    Distribusi Paket Terpopuler
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Kuantitas transaksi terverifikasi sukses per paket produk</p>
                </div>
                <Tag className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="h-72 w-full pr-4 text-xs font-semibold select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" tickLine={false} />
                    <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", borderRadius: "12px" }}
                      formatter={(v: any) => [`${v} Transaksi`, "Jumlah"]}
                      labelStyle={{ color: "#27272a", fontWeight: "bold" }}
                    />
                    <Bar dataKey="Jumlah Transaksi" fill="#6366f1" radius={[8, 8, 0, 0]}>
                      {productData.map((entry, index) => {
                        const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f5a623", "#14b8a6"];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Product Stats Audit Table (3 cols) */}
            <div className="glass-panel-light p-6 rounded-2xl lg:col-span-3 space-y-4 shadow-sm bg-white border border-zinc-200">
              <div>
                <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2 tracking-tight">
                  <Briefcase className="w-4 h-4 text-amber-550" />
                  Statistik Rinci Paket Billing
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Analisis konversi dan volume pendapatan per item paket langganan</p>
              </div>
              
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[10px] tracking-wider uppercase font-bold text-zinc-500">
                      <th className="pb-3 pr-4">Paket Langganan</th>
                      <th className="pb-3 text-center px-4">Jumlah Penjualan</th>
                      <th className="pb-3 text-right pl-4">Total Akumulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150/70 text-zinc-650">
                    {productStatsTable.map((prod) => (
                      <tr key={prod.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3.5 pr-4 font-semibold text-zinc-700">
                          {prod.name}
                          <span className="block text-[9px] text-zinc-400 font-mono mt-0.5">{prod.id}</span>
                        </td>
                        <td className="py-3.5 text-center px-4 font-bold text-zinc-500">
                          {prod.count} kali
                        </td>
                        <td className="py-3.5 text-right pl-4 font-extrabold text-zinc-900">
                          {formatIDR(prod.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transaction Outcome Proportion Pie Chart (2 cols) */}
            <div className="glass-panel-light p-6 rounded-2xl lg:col-span-2 space-y-4 flex flex-col justify-between shadow-sm bg-white border border-zinc-200">
              <div>
                <h2 className="text-base font-bold text-zinc-800 flex items-center gap-2 tracking-tight">
                  <PieIcon className="w-4 h-4 text-pink-600" />
                  Status Outcome Transaksi
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">Pembagian proporsi seluruh log transaksi yang terekam</p>
              </div>

              <div className="flex items-center justify-center h-48 select-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", borderRadius: "12px" }}
                      formatter={(v: any) => [`${v} Transaksi`, "Jumlah"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Status Outcomes Custom Legend */}
              <div className="grid grid-cols-2 gap-3 text-[10px] font-bold tracking-wide uppercase">
                {statusData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-zinc-500 truncate">{entry.name}: <span className="text-zinc-800 font-extrabold">{entry.value}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
