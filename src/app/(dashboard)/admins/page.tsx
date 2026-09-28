"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { adminsApi, AdminUser } from "@/utils/api";
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
  Search,
  Clock,
  Sparkles,
  Smartphone
} from "lucide-react";

export default function AdminsPage() {
  const { userRole } = useApp();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
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

  const fetchUsers = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await adminsApi.list();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat daftar pengguna. Hak akses Superadmin diperlukan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      fetchUsers();
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
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || "Gagal membuat akun admin baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (user: AdminUser) => {
    const currentActive = user.is_active ?? user.isActive ?? true;
    try {
      await adminsApi.toggleActive(user.id, !currentActive);
      await fetchUsers();
    } catch (err: any) {
      alert(`Gagal memperbarui status akun: ${err.message}`);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchesSearch = 
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);

      const matchesRole = 
        roleFilter === "all" || 
        u.role.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const counts = useMemo(() => {
    const total = users.length;
    const superadmins = users.filter(u => u.role === "superadmin").length;
    const admins = users.filter(u => u.role === "admin").length;
    const mobileUsers = users.filter(u => u.role === "user").length;
    return { total, superadmins, admins, mobileUsers };
  }, [users]);

  const getRoleBadge = (r: string) => {
    switch (r.toLowerCase()) {
      case "superadmin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldAlert className="w-3 h-3 text-purple-600" />
            SUPERADMIN
          </span>
        );
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            ADMIN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            <User className="w-3 h-3 text-zinc-500" />
            USER MOBILE
          </span>
        );
    }
  };

  const getSubBadge = (u: AdminUser) => {
    const status = u.subscription_status || "unsubscribed";
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <Check className="w-3 h-3 text-emerald-600" />
            Langganan Aktif
          </span>
        );
      case "trial":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
            <Sparkles className="w-3 h-3 text-amber-600" />
            Trial ({u.days_left_in_trial ?? 0} hari)
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-100 text-red-800">
            Expired
          </span>
        );
      default:
        return (
          <span className="text-[10px] text-zinc-400 font-medium">
            Non-langganan
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 font-display flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-purple-600" />
            Kelola Administrator & Pengguna
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manajemen hak akses RBAC, status keaktifan akun, dan pantauan status langganan pengguna sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-50 shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-600" : ""}`} />
            Muat Ulang
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Admin Baru
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Akun</span>
          <span className="text-2xl font-black text-zinc-900 font-display">{counts.total}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Superadmin</span>
          <span className="text-2xl font-black text-purple-700 font-display">{counts.superadmins}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Staff Admin</span>
          <span className="text-2xl font-black text-blue-700 font-display">{counts.admins}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Pengguna Mobile</span>
          <span className="text-2xl font-black text-zinc-700 font-display">{counts.mobileUsers}</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel-light p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm bg-white border border-zinc-200">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau peran..."
            className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-purple-500 transition-colors focus:ring-1 focus:ring-purple-500/25"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-zinc-400 font-medium">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Semua Peran</option>
            <option value="superadmin">Superadmin</option>
            <option value="admin">Admin</option>
            <option value="user">User Mobile</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel-light rounded-2xl overflow-hidden shadow-md border border-zinc-200 bg-white">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] tracking-wider uppercase font-bold text-zinc-500">
                <th className="py-4 px-6">Pengguna & Email</th>
                <th className="py-4 px-6 text-center">Peran (Role)</th>
                <th className="py-4 px-6 text-center">Status Langganan</th>
                <th className="py-4 px-6 text-center">Status Akun</th>
                <th className="py-4 px-6">Login Terakhir</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-150/70 text-xs text-zinc-650">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const userActive = u.is_active ?? u.isActive ?? true;
                  const isGoogle = u.login_type === "google";

                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-800">{u.name}</span>
                            {isGoogle && (
                              <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded" title="Login via Google SSO">
                                Google SSO
                              </span>
                            )}
                          </div>
                          <span className="block text-[11px] text-zinc-400 select-all font-mono">{u.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {getSubBadge(u)}
                      </td>

                      <td className="py-4 px-6 text-center">
                        {userActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-full">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-zinc-500 text-[11px]">
                        {u.last_login_at ? (
                          new Date(u.last_login_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        ) : (
                          <span className="text-zinc-400 italic">Belum pernah</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer
                            ${userActive ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
                        >
                          {userActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500 font-medium">
                    Tidak ada pengguna yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md p-6 animate-scale-in">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200 mb-4">
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                  Tambah Akun Administrator Baru
                </h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="misal: Budi Santoso"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Alamat Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@terragis.io"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Kata Sandi (Min 6 Karakter)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Tingkat Hak Akses (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:border-purple-500 focus:bg-white cursor-pointer"
                  >
                    <option value="admin">Staff Admin (Akses Operasional)</option>
                    <option value="superadmin">Superadmin (Akses Penuh Kelola Admin & Produk)</option>
                  </select>
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
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Menyimpan..." : "Buat Akun Admin"}
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
