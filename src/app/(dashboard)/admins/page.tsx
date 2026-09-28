"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { adminsApi } from "@/utils/api";
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  User, 
  Mail, 
  Lock, 
  Shield, 
  RefreshCw,
  AlertCircle,
  Clock,
  KeyRound
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export default function AdminsPage() {
  const { userRole } = useApp();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New Admin Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
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

  const fetchAdmins = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await adminsApi.list();
      if (res.success && res.data) {
        setAdmins(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat daftar admin. Hak akses Superadmin diperlukan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      fetchAdmins();
    } else {
      setIsLoading(false);
    }
  }, [isSuperadmin]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await adminsApi.create({ email, name, password, role });
      setShowAddModal(false);
      setEmail("");
      setName("");
      setPassword("");
      setRole("admin");
      await fetchAdmins();
    } catch (err: any) {
      setError(err.message || "Gagal membuat akun admin baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await adminsApi.toggleActive(id, !currentActive);
      await fetchAdmins();
    } catch (err: any) {
      alert(`Gagal mengubah status admin: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8 relative min-h-[calc(100vh-10rem)]">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display">
            Kelola Admin & Akses Peran (Role RBAC)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Pengaturan peran pengguna, struktur hirarki otorisasi, dan manajemen akun administrator.
          </p>
        </div>

        {isSuperadmin && (
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdmins}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-emerald-500" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Admin Baru
            </button>
          </div>
        )}
      </div>

      {/* Role Matrix Card & Comparison Table */}
      <div className="glass-panel-light p-6 rounded-2xl shadow-sm bg-white border border-zinc-200 space-y-4">
        <div className="flex items-center gap-2.5 mb-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-base font-bold text-zinc-800">Matriks Hak Akses Peran (Role Permission Matrix)</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase font-bold text-zinc-500">
                <th className="py-3 px-4">Fitur / Tindakan Server</th>
                <th className="py-3 px-4 text-center">Superadmin</th>
                <th className="py-3 px-4 text-center">Admin (Staff)</th>
                <th className="py-3 px-4 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150 text-zinc-700">
              <tr>
                <td className="py-3 px-4 font-semibold">Lihat Analitik & Transaksi</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Penuh</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Penuh</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Lihat Saja</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Export Laporan CSV & JSON</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-3 px-4 text-center text-zinc-400 font-bold">✕ Tidak</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Ubah Status Transaksi</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-3 px-4 text-center text-zinc-400 font-bold">✕ Tidak</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Hapus Log Transaksi Permanen</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Diblokir (403)</td>
                <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Diblokir (403)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Kelola Produk Billing (`/products`)</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Diblokir (403)</td>
                <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Diblokir (403)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold">Manajemen Pengguna Admin (`/admins`)</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Ya</td>
                <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Diblokir (403)</td>
                <td className="py-3 px-4 text-center text-red-500 font-bold">✕ Diblokir (403)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Admin List Section */}
      {isSuperadmin && (
        <div className="glass-panel-light rounded-2xl overflow-hidden shadow-md border border-zinc-200 bg-white">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Daftar Akun Administrator Terdaftar ({admins.length})
            </h3>
          </div>

          {error && (
            <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] tracking-wider uppercase font-bold text-zinc-500">
                  <th className="py-3.5 px-6">Nama Admin / Email</th>
                  <th className="py-3.5 px-6">Peran (Role)</th>
                  <th className="py-3.5 px-6 text-center">Status Akses</th>
                  <th className="py-3.5 px-6">Tanggal Dibuat</th>
                  <th className="py-3.5 px-6 text-center">Tindakan Superadmin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 text-xs text-zinc-700">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <span className="font-bold text-zinc-900">{adm.name}</span>
                        <span className="block text-[11px] text-zinc-500 font-mono">{adm.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border
                        ${adm.role === "superadmin" 
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" 
                          : "bg-indigo-500/10 border-indigo-500/30 text-indigo-600"}`}>
                        <Shield className="w-3 h-3" />
                        {adm.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {adm.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          ● Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold">
                          ● Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-zinc-500 text-[11px]">
                      {new Date(adm.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleActive(adm.id, adm.is_active)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                          ${adm.is_active 
                            ? "bg-red-50 hover:bg-red-100 text-red-600 border-red-200" 
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"}`}
                      >
                        {adm.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md p-6 animate-scale-in">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-200 mb-4">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600" />
                  Tambah Akun Admin Baru
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Contoh: Farhan Halim"
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nama@terragis.io"
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Kata Sandi</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Peran (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="admin">Admin (Staff Operasional)</option>
                    <option value="superadmin">Superadmin (Akses Penuh)</option>
                    <option value="viewer">Viewer (Lihat Saja)</option>
                  </select>
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
                    {isSubmitting ? "Menyimpan..." : "Simpan Admin"}
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
