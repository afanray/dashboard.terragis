"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Globe, Lock, Mail, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { loginWithApi, loginWithGoogle, firebaseConfigured } = useApp();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleApiLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await loginWithApi(email, password);
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Silakan periksa email dan kata sandi Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Gagal masuk menggunakan Google Authentication.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-50 overflow-hidden font-sans">
      {/* Background ambient glowing nodes */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[150px]" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative w-full max-w-md px-6 py-8 animate-fade-in">
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] mb-3">
            <Globe className="w-7 h-7 text-zinc-950" />
            <div className="absolute inset-0 rounded-2xl border border-white/20" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 font-display">
            TERRA <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">GIS</span>
          </h1>
          <p className="text-xs tracking-widest text-zinc-400 uppercase mt-1 font-semibold">
            Donation & Support Console
          </p>
        </div>

        {/* Glassmorphic Login Container */}
        <div className="glass-panel-light p-8 rounded-2xl shadow-xl relative overflow-hidden bg-white/80 backdrop-blur-xl border border-zinc-200/80">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-zinc-800 font-display">Masuk ke Dashboard</h2>
          </div>
          
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200/60 text-red-700 text-xs flex flex-col gap-1 animate-scale-in">
              <span className="font-bold">Galat Autentikasi:</span>
              <p className="font-medium text-red-600/90">{error}</p>
            </div>
          )}

          {/* Form Login Admin */}
          <form onSubmit={handleApiLogin} className="flex flex-col gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email Administrator</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Masukkan email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-2.5 px-4 rounded-xl text-xs tracking-wide shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
            <span className="relative px-3 bg-white text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">atau</span>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={isGoogleLoading || !firebaseConfigured}
            className={`w-full relative overflow-hidden group bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-xl py-2.5 text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-sm hover:shadow`}
          >
            {isGoogleLoading ? (
              <div className="w-4 h-4 border-2 border-zinc-900/20 border-t-zinc-700 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Masuk dengan Google (SSO)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
