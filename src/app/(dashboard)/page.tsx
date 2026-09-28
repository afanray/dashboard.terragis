"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { 
  Heart, 
  CreditCard, 
  Calendar, 
  Percent, 
  ArrowUpRight, 
  CircleDollarSign,
  UserCheck,
  Zap
} from "lucide-react";

export default function OverviewPage() {
  const { transactions } = useApp();

  // Format currency to IDR (e.g., Rp25.450.000)
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Compute metrics from the active transactions dataset
  const metrics = useMemo(() => {
    const successTransactions = transactions.filter(tx => tx.status === "Success");
    
    const totalSupport = successTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalCount = successTransactions.length;
    
    // July 2026 is month = 6 in JS (July)
    const currentMonthSupport = successTransactions
      .filter(tx => {
        const date = new Date(tx.createdAt);
        return date.getMonth() === 6 && date.getFullYear() === 2026;
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

  // Product breakdown calculation
  const productStats = useMemo(() => {
    const successTransactions = transactions.filter(tx => tx.status === "Success");
    const counts = {
      support_10000: { count: 0, sum: 0, label: "Rp10.000 (Kopi)" },
      support_25000: { count: 0, sum: 0, label: "Rp25.000 (Camilan)" },
      support_50000: { count: 0, sum: 0, label: "Rp50.000 (Makan Siang)" },
      support_100000: { count: 0, sum: 0, label: "Rp100.000 (Premium)" }
    };

    successTransactions.forEach(tx => {
      if (tx.productId in counts) {
        const key = tx.productId as keyof typeof counts;
        counts[key].count++;
        counts[key].sum += tx.amount;
      }
    });

    return Object.values(counts);
  }, [transactions]);

  // Get latest 5 successful transactions
  const recentActivities = useMemo(() => {
    return transactions
      .filter(tx => tx.status === "Success")
      .slice(0, 5);
  }, [transactions]);

  const kpiCards = [
    {
      title: "TOTAL DUKUNGAN",
      value: formatIDR(metrics.totalSupport),
      subtext: "Akumulasi seluruh dana masuk",
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
      title: "DUKUNGAN BULAN INI",
      value: formatIDR(metrics.currentMonthSupport),
      subtext: "Akumulasi bulan berjalan 2026",
      icon: Calendar,
      color: "from-violet-500 to-fuchsia-400",
      glow: "rgba(139,92,246,0.15)"
    },
    {
      title: "RATA-RATA DUKUNGAN",
      value: formatIDR(metrics.averageSupport),
      subtext: "Per transaksi sukses",
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
            Pantau arus dana dukungan, aktivitas pengguna, dan statistik performa produk billing Google Play secara real-time.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-150/70 border border-zinc-200 text-xs text-zinc-650 font-semibold select-none shadow-sm">
          <Zap className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sesi Live Terhubung</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className="glass-panel-light p-6 rounded-2xl relative group overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-zinc-300"
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
        <div className="glass-panel-light p-6 rounded-2xl lg:col-span-3 space-y-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-bold text-zinc-800 tracking-tight">Statistik Produk Dukungan</h2>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CircleDollarSign className="w-3.5 h-3.5" />
                Billing Google Play
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Rincian nominal dukungan yang dibeli oleh pengguna Terra GIS.
            </p>

            <div className="space-y-4">
              {productStats.map((prod, idx) => {
                const totalIncome = prod.sum;
                const percentage = metrics.totalSupport > 0 
                  ? Math.round((totalIncome / metrics.totalSupport) * 100) 
                  : 0;

                const barColor = idx === 0 ? "bg-emerald-500" :
                                 idx === 1 ? "bg-blue-500" :
                                 idx === 2 ? "bg-violet-500" : "bg-amber-500";
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-600">{prod.label}</span>
                      <div className="space-x-3 text-zinc-500">
                        <span>{prod.count} Kali</span>
                        <span className="text-zinc-850 font-bold">{formatIDR(totalIncome)}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
                        style={{ width: `${percentage}%` }}
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
        </div>

        {/* Right: Recent Activity Feed (2 columns) */}
        <div className="glass-panel-light p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-base font-bold text-zinc-800 tracking-tight">Dukungan Terbaru</h2>
              <span className="text-xs text-indigo-650 font-semibold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                Real-Time Feed
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-6">
              Arus masuk pembayaran sukarela pengguna.
            </p>

            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((tx, idx) => {
                  const txDate = new Date(tx.createdAt);
                  const formattedTime = txDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  });

                  return (
                    <div key={tx.id} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-150/60 group hover:bg-zinc-100/70 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-250 text-emerald-600 font-bold text-xs flex items-center justify-center shrink-0">
                        ☕
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-zinc-800 truncate">{tx.userName}</p>
                          <span className="text-[10px] text-zinc-650 font-bold shrink-0">{formatIDR(tx.amount)}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 truncate">{tx.userEmail}</p>
                        <p className="text-[9px] text-zinc-400 font-semibold">{formattedTime} • ID: {tx.id}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-zinc-500 font-medium">
                  Tidak ada transaksi (Database Kosong)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
