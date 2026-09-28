"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { productsApi, ProductItem } from "@/utils/api";
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  X, 
  Tag, 
  CircleDollarSign,
  Calendar,
  Sparkles,
  Layers,
  Smartphone
} from "lucide-react";

export default function ProductsPage() {
  const { userRole } = useApp();
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form State
  const [productId, setProductId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">(49000);
  const [originalAmount, setOriginalAmount] = useState<number | "">("");
  const [discountPercent, setDiscountPercent] = useState<number | "">(0);
  const [billingPeriod, setBillingPeriod] = useState("monthly");
  const [trialDays, setTrialDays] = useState<number | "">(7);
  const [googlePlayProductId, setGooglePlayProductId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSuperadmin = userRole?.toLowerCase() === "superadmin";

  useEffect(() => {
    if (userRole && !isSuperadmin) {
      router.replace("/");
    }
  }, [userRole, isSuperadmin, router]);

  if (!isSuperadmin) {
    return null;
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setError("");
    try {
      // activeOnly=false to retrieve all products (active and inactive) for admin management
      const res = await productsApi.list(false);
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat katalog produk billing.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setProductId("");
    setTitle("");
    setDescription("");
    setAmount(49000);
    setOriginalAmount("");
    setDiscountPercent(0);
    setBillingPeriod("monthly");
    setTrialDays(7);
    setGooglePlayProductId("");
    setIsActive(true);
    setShowAddModal(true);
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setTitle(p.title);
    setDescription(p.description || "");
    setAmount(p.amount);
    setOriginalAmount(p.original_amount ?? p.originalAmount ?? "");
    setDiscountPercent(p.discount_percent ?? p.discountPercent ?? 0);
    setBillingPeriod(p.billing_period ?? p.billingPeriod ?? "monthly");
    setTrialDays(p.trial_days ?? p.trialDays ?? 7);
    setGooglePlayProductId(p.google_play_product_id ?? p.googlePlayProductId ?? "");
    setIsActive(p.is_active ?? p.isActive ?? true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId.trim() || !title.trim() || amount === "" || amount < 0) return;
    setIsSubmitting(true);
    setError("");
    try {
      await productsApi.create({
        id: productId.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        currency: "IDR",
        billing_period: billingPeriod,
        trial_days: Number(trialDays) || 0,
        original_amount: originalAmount !== "" ? Number(originalAmount) : undefined,
        discount_percent: Number(discountPercent) || 0,
        google_play_product_id: googlePlayProductId.trim() || undefined,
        is_active: isActive,
      });
      setShowAddModal(false);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Gagal membuat paket produk baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    setError("");
    try {
      await productsApi.update(editingProduct.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        amount: Number(amount),
        billing_period: billingPeriod,
        trial_days: Number(trialDays) || 0,
        original_amount: originalAmount !== "" ? Number(originalAmount) : undefined,
        discount_percent: Number(discountPercent) || 0,
        google_play_product_id: googlePlayProductId.trim() || undefined,
        is_active: isActive,
      });
      setEditingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui paket produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: ProductItem) => {
    if (!isSuperadmin) return;
    const currentActive = product.is_active ?? product.isActive ?? true;
    try {
      await productsApi.update(product.id, { is_active: !currentActive });
      await fetchProducts();
    } catch (err: any) {
      alert(`Gagal mengubah status produk: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!isSuperadmin) {
      alert("Akses Diblokir: Hanya Superadmin yang berhak menghapus produk billing.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus paket produk '${id}'? Transaksi yang sudah ada akan tetap tersimpan.`)) return;

    try {
      await productsApi.delete(id);
      await fetchProducts();
    } catch (err: any) {
      alert(`Gagal menghapus produk: ${err.message}`);
    }
  };

  const getBillingPeriodBadge = (period?: string) => {
    switch (period?.toLowerCase()) {
      case "monthly":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Bulanan</span>;
      case "yearly":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Tahunan</span>;
      case "lifetime":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Selamanya</span>;
      case "group":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Paket Bersama (Team)</span>;
      case "trial":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">Uji Coba Gratis</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">{period || "Standar"}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display flex items-center gap-2.5">
            <Package className="w-6 h-6 text-emerald-600" />
            Katalog Produk & Paket Langganan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Kelola paket langganan Terra GIS, harga, trial gratis, diskon, dan integrasi Google Play In-App Billing.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
            Muat Ulang
          </button>
          
          {isSuperadmin && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Paket Produk
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => {
          const productActive = p.is_active ?? p.isActive ?? true;
          const origAmt = p.original_amount ?? p.originalAmount;
          const discPct = p.discount_percent ?? p.discountPercent ?? 0;
          const pPeriod = p.billing_period ?? p.billingPeriod ?? "monthly";
          const pTrial = p.trial_days ?? p.trialDays ?? 0;
          const gPlayId = p.google_play_product_id ?? p.googlePlayProductId;

          return (
            <div 
              key={p.id}
              className={`p-5 rounded-2xl bg-white border shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group
                ${productActive ? "border-zinc-200" : "border-zinc-200/60 bg-zinc-50/50 opacity-80"}`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-emerald-700 font-bold">
                      {p.id}
                    </span>
                    {getBillingPeriodBadge(pPeriod)}
                  </div>
                  {productActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full shrink-0">
                      <XCircle className="w-3 h-3" /> Nonaktif
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-display">{p.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                    {p.description || "Akses penuh fitur pemetaan Terra GIS"}
                  </p>
                </div>

                {/* Price block with discount */}
                <div className="pt-2">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Harga Langganan</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-extrabold text-zinc-900 font-display">{formatIDR(p.amount)}</span>
                    {origAmt && origAmt > p.amount && (
                      <span className="text-xs text-zinc-400 line-through">
                        {formatIDR(origAmt)}
                      </span>
                    )}
                    {discPct > 0 && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        Hemat {discPct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Badges: Trial Days & Google Play ID */}
                <div className="pt-2 border-t border-zinc-100 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                  {pTrial > 0 && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      {pTrial} Hari Gratis
                    </span>
                  )}
                  {gPlayId ? (
                    <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-md font-mono text-[10px]" title="Google Play Product ID">
                      <Smartphone className="w-3 h-3 text-zinc-400" />
                      {gPlayId}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Actions for Superadmin */}
              {isSuperadmin && (
                <div className="pt-4 mt-4 border-t border-zinc-150 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer
                      ${productActive ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
                  >
                    {productActive ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit Paket"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Paket"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-4">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Tambah Paket Langganan Baru
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Product ID (Kode Unik)</label>
                  <input
                    type="text"
                    required
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    placeholder="misal: terragis_sub_quarterly"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Harus unik dan cocok dengan Google Play Console SKU.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Judul Paket</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="misal: Paket 3 Bulan"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Periode Tagihan</label>
                    <select
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                    >
                      <option value="monthly">Bulanan (monthly)</option>
                      <option value="yearly">Tahunan (yearly)</option>
                      <option value="lifetime">Selamanya (lifetime)</option>
                      <option value="group">Paket Bersama / Team (group)</option>
                      <option value="trial">Uji Coba Gratis (trial)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Deskripsi Paket</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Keunggulan dan detail paket..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga (IDR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga Coret (Opsional)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={originalAmount}
                      onChange={(e) => setOriginalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="misal: 100000"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Diskon (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Durasi Trial (Hari)</label>
                    <input
                      type="number"
                      min={0}
                      value={trialDays}
                      onChange={(e) => setTrialDays(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Google Play SKU (Opsional)</label>
                    <input
                      type="text"
                      value={googlePlayProductId}
                      onChange={(e) => setGooglePlayProductId(e.target.value)}
                      placeholder="SKU Google Play..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveAdd"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isActiveAdd" className="text-xs text-zinc-700 cursor-pointer select-none">
                    Aktifkan produk langsung di katalog aplikasi mobile
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <>
          <div onClick={() => setEditingProduct(null)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-4">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  Edit Paket Produk: {editingProduct.id}
                </h3>
                <button onClick={() => setEditingProduct(null)} className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Judul Paket</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Periode Tagihan</label>
                    <select
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                    >
                      <option value="monthly">Bulanan (monthly)</option>
                      <option value="yearly">Tahunan (yearly)</option>
                      <option value="lifetime">Selamanya (lifetime)</option>
                      <option value="group">Paket Bersama / Team (group)</option>
                      <option value="trial">Uji Coba Gratis (trial)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Deskripsi Paket</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga (IDR)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={1000}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Harga Coret (IDR)</label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={originalAmount}
                      onChange={(e) => setOriginalAmount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Diskon (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Durasi Trial (Hari)</label>
                    <input
                      type="number"
                      min={0}
                      value={trialDays}
                      onChange={(e) => setTrialDays(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Google Play SKU</label>
                    <input
                      type="text"
                      value={googlePlayProductId}
                      onChange={(e) => setGooglePlayProductId(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="isActiveEdit" className="text-xs text-zinc-700 cursor-pointer select-none">
                    Status Produk Aktif
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Perbarui Produk"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
