"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { productsApi } from "@/utils/api";
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
  Info
} from "lucide-react";

interface ProductItem {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

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
  const [amount, setAmount] = useState<number | "">(10000);
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
      const res = await productsApi.list();
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat katalog produk dukungan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setIsSubmitting(true);
    setError("");
    try {
      await productsApi.create({
        id: productId,
        title,
        description,
        amount: Number(amount),
        currency: "IDR",
        isActive: true,
      });
      setShowAddModal(false);
      setProductId("");
      setTitle("");
      setDescription("");
      setAmount(10000);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Gagal membuat produk baru.");
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
        title,
        description,
        amount: Number(amount),
        isActive: editingProduct.isActive,
      });
      setEditingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (product: ProductItem) => {
    if (!isSuperadmin) return;
    try {
      await productsApi.update(product.id, { isActive: !product.isActive });
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
    if (!confirm(`Apakah Anda yakin ingin menghapus paket produk '${id}'?`)) return;

    try {
      await productsApi.delete(id);
      await fetchProducts();
    } catch (err: any) {
      alert(`Gagal menghapus produk: ${err.message}`);
    }
  };

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setTitle(p.title);
    setDescription(p.description || "");
    setAmount(p.amount);
  };

  return (
    <div className="space-y-8 relative min-h-[calc(100vh-10rem)]">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display">
            Kelola Produk Billing Dukungan (`/products`)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pengaturan item nominal paket dukungan Google Play In-App Purchase.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
            Refresh
          </button>
          
          {isSuperadmin && (
            <button
              onClick={() => {
                setProductId(`support_${Math.floor(Math.random() * 900000 + 100000)}`);
                setTitle("");
                setDescription("");
                setAmount(25000);
                setShowAddModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Produk Baru
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.map((p) => (
          <div 
            key={p.id}
            className="glass-panel-light p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-emerald-600 font-bold">
                  {p.id}
                </span>
                {p.isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                    <XCircle className="w-3 h-3" /> Nonaktif
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-900 font-display">{p.title}</h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                  {p.description || "Paket dukungan sukarela pengembangan Terra GIS"}
                </p>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Nominal Paket</span>
                <span className="text-xl font-extrabold text-zinc-900 font-display">{formatIDR(p.amount)}</span>
              </div>
            </div>

            {/* Actions for Superadmin */}
            {isSuperadmin && (
              <div className="pt-4 mt-4 border-t border-zinc-150 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleActive(p)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer
                    ${p.isActive ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                >
                  {p.isActive ? "Nonaktifkan" : "Aktifkan"}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Edit Produk"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-1.5 hover:bg-red-50 text-zinc-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Produk"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md p-6 animate-scale-in">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-4">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Tambah Produk Billing Baru
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Product ID (Google Play In-App Purchase)</label>
                  <input
                    type="text"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                    placeholder="support_150000"
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-emerald-600 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Judul Paket</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Dukungan Rp150.000 (Sponsor Khusus)"
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Deskripsi Ringkas</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Deskripsi paket dukungan..."
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nominal (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    min={1000}
                    placeholder="150000"
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50"
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
            <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md p-6 animate-scale-in">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-4">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-600" />
                  Edit Produk {editingProduct.id}
                </h3>
                <button onClick={() => setEditingProduct(null)} className="p-1 text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Judul Paket</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Deskripsi Ringkas</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nominal (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    min={1000}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? "Perbarui..." : "Simpan Perubahan"}
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
