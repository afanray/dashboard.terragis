"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { analyticsApi } from "@/utils/api";
import { 
  Heart, 
  CreditCard, 
  Calendar, 
  Percent, 
  ArrowUpRight, 
  CircleDollarSign,
  UserCheck,
  Zap,
  TrendingUp,
  Package
} from "lucide-react";
import Link from "next/link";

export default function OverviewPage() {
  const { transactions, apiConnected } = useApp();
  const [backendOverview, setBackendOverview] = useState<{
    totalSupport: number;
    totalCount: number;
    currentMonthSupport: number;
    averageSupport: number;
  } | null>(null);

  const [backendProductStats, setBackendProductStats] = useState<Array<{
    productId: string;
    label: string;
    count: number;
    sum: number;
  }> | null>(null);

  useEffect(() => {
    analyticsApi.getOverview().then(res => {
      if (res.success && res.data) {
        setBackendOverview(res.data);
      }
    }).catch(() => {});

    analyticsApi.getProductStats().then(res => {
      if (res.success && res.data) {
        setBackendProductStats(res.data);
      }
    }).catch(() => {});
  }, [transactions]);

  // Format currency to IDR (e.g., Rp25.450.000)
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Compute fallback metrics from the active transactions dataset
  const localMetrics = useMemo(() => {
    const successTransactions = transactions.filter(tx => tx.status === "Success");
    
    const totalSupport = successTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCount = successTransactions.length;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthSupport = successTransactions
      .filter(tx => {
        const date = new Date(tx.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);
      
    const averageSupport = totalCount > 0 ? totalSupport / totalCount : 0;

    return {
      totalSupport,
      totalCount,
      currentMonthSupport,
      averageSupport
    };
  }, [transactions]);

  const metrics = backendOverview || localMetrics;

  // Product breakdown calculation
  const productStats = useMemo(() => {
    if (backendProductStats && backendProductStats.length > 0) {
      return backendProductStats;
    }

    const successTransactions = transactions.filter(tx => tx.status === "Success");
    const counts: Record<string, { count: number; sum: number; label: string }> = {
      terragis_sub_monthly: { count: 0, sum: 0, label: "Paket Perbulan" },
      terragis_sub_yearly: { count: 0, sum: 0, label: "Paket Pertahun" },
      terragis_sub_lifetime: { count: 0, sum: 0, label: "Paket Selamanya" },
      terragis_sub_group: { count: 0, sum: 0, label: "Paket Bersama (Team)" },
    };

    successTransactions.forEach(tx => {
      const pid = tx.productId || "terragis_sub_monthly";
      if (!counts[pid]) {
        counts[pid] = { count: 0, sum: 0, label: tx.name || pid };
      }
      counts[pid].count++;
      counts[pid].sum += tx.amount;
    });

    return Object.values(counts);
  }, [backendProductStats, transactions]);

  // Get latest 5 successful transactions
  const recentActivities = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const kpiCards = [
    {
      title: "TOTAL PENDAPATAN",
      value: formatIDR(metrics.totalSupport),
      subtext: "Akumulasi seluruh transaksi langganan",
      icon: Heart,
      color: "from-emerald-500 to-teal-400",
      glow: "rgba(16,185,129,0.15)"
    },
    {
      title: "TRANSAKSI BERHASIL",
      value: metrics.totalCount.toLocaleString("id-ID"),
      subtext: "Log pembayaran terproses sukses",
      icon: CreditCard,
      color: "from-blue-500 to-indigo-400",
      glow: "rgba(59,130,246,0.15)"
    },
    {
      title: "PENDAPATAN BULAN INI",
      value: formatIDR(metrics.currentMonthSupport),
      subtext: "Akumulasi bulan berjalan",
      icon: Calendar,
      color: "from-violet-500 to-fuchsia-400",
      glow: "rgba(139,92,246,0.15)"
    },
    {
      title: "RATA-RATA TRANSAKSI",
      value: formatIDR(metrics.averageSupport),
      subtext: "Per pembayaran langganan sukses",
      icon: Percent,
      color: "from-amber-500 to-orange-400",
      glow: "rgba(245,158,11,0.15)"
    }
  ];

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display">
            Selamat Datang di Terra GIS Console
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pantau arus pendapatan langganan, log transaksi, status pengguna, dan katalog paket billing secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-150/70 border border-zinc-200 text-xs text-zinc-650 font-semibold select-none shadow-sm">
          <Zap className={`w-3.5 h-3.5 ${apiConnected ? "text-emerald-500" : "text-amber-500"}`} />
          <span>{apiConnected ? "Koneksi Server : Terhubung" : "Koneksi Server : Terputus"}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className="glass-panel-light p-6 rounded-2xl relative group overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-zinc-300 bg-white border border-zinc-200"
              style={{ boxShadow: `0 10px 30px -10px ${card.glow}` }}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] tracking-widest font-bold text-zinc-400 uppercase">{card.title}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${card.color} text-zinc-950 shadow-md`}>
                  <Icon className="w-4 h-4 text-zinc-950" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight leading-none font-display">
                  {card.value}
                </h3>
                <p className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                  <span>{card.subtext}</span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-600 shrink-0" />
                </p>
              </div>

              {/* Bottom Glow Strip */}
              <div className={`absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          );
        })}
      </div>

      {/* Analytics Summaries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Product Performance Breakdown (3 columns) */}
        <div className="glass-panel-light p-6 rounded-2xl lg:col-span-3 space-y-6 flex flex-col justify-between shadow-sm bg-white border border-zinc-200">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-bold text-zinc-800 tracking-tight flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                Statistik Paket Langganan
              </h2>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CircleDollarSign className="w-3.5 h-3.5" />
                Billing Real-Time
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Rincian nominal langganan yang dibeli oleh pengguna Terra GIS.
            </p>

            <div className="space-y-4">
              {productStats.map((prod, idx) => {
                const totalIncome = prod.sum;
                const percentage = metrics.totalSupport > 0 
                  ? Math.round((totalIncome / metrics.totalSupport) * 100) 
                  : 0;

                const barColors = [
                  "bg-emerald-500",
                  "bg-blue-500",
                  "bg-violet-500",
                  "bg-amber-500",
                  "bg-teal-500"
                ];
                const barColor = barColors[idx % barColors.length];

                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-700">{prod.label}</span>
                      <div className="space-x-3 text-zinc-500">
                        <span>{prod.count} Transaksi</span>
                        <span className="text-zinc-900 font-bold">{formatIDR(totalIncome)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <span className="text-[10px] text-zinc-400 font-semibold">{percentage}% kontribusi total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-150 flex justify-between items-center text-xs">
            <span className="text-zinc-400">Kelola rincian harga dan durasi trial</span>
            <Link href="/produk" className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
              Katalog Produk <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right: Recent Activity Feed (2 columns) */}
        <div className="glass-panel-light p-6 rounded-2xl lg:col-span-2 space-y-4 shadow-sm bg-white border border-zinc-200">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-zinc-800 tracking-tight">Aktivitas Terkini</h2>
            <Link href="/transactions" className="text-xs text-emerald-600 hover:underline font-semibold">
              Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {recentActivities.map((tx) => {
              const statusColor = 
                tx.status === "Success" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                tx.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                "bg-red-500/10 text-red-600 border-red-500/20";

              return (
                <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-800 line-clamp-1">{tx.userName}</p>
                    <p className="text-[11px] text-zinc-400">{tx.name || tx.productId}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-xs font-extrabold text-zinc-900 font-display">{formatIDR(tx.amount)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${statusColor}`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
