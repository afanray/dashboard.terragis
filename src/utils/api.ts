export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    // When running locally in browser, route via Next.js proxy to bypass CORS
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "/api/proxy";
    }
  }
  return "https://core.gis.terralium.tech/api/v1";
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp?: string;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedApiSuccessResponse<T> {
  success: true;
  data: T[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ProductItem {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  billing_period?: string;
  billingPeriod?: string;
  trial_days?: number;
  trialDays?: number;
  original_amount?: number | null;
  originalAmount?: number | null;
  discount_percent?: number;
  discountPercent?: number;
  google_play_product_id?: string | null;
  googlePlayProductId?: string | null;
  is_active: boolean;
  isActive: boolean;
  created_at?: string;
  createdAt?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  isActive?: boolean;
  created_at: string;
  createdAt?: string;
  last_login_at?: string | null;
  subscription_status?: string;
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  active_plan_id?: string | null;
  login_type?: string;
  has_access?: boolean;
  days_left_in_trial?: number;
  is_group_member?: boolean;
  is_email_verified?: boolean;
}

export interface UserSubscriptionItem {
  id: string;
  user_id: string;
  userId?: string;
  user_name?: string | null;
  userName?: string | null;
  user_email?: string | null;
  userEmail?: string | null;
  product_id: string;
  productId?: string;
  product_title?: string | null;
  productTitle?: string | null;
  transaction_id?: string | null;
  transactionId?: string | null;
  group_id?: string | null;
  groupId?: string | null;
  start_date: string;
  startDate?: string;
  end_date: string;
  endDate?: string;
  status: "active" | "queued" | "expired" | "cancelled" | string;
  billing_period: "monthly" | "yearly" | "lifetime" | "group" | "trial" | string;
  billingPeriod?: string;
  amount: number;
  currency: string;
  payment_method: string;
  paymentMethod?: string;
  created_at: string;
  createdAt?: string;
  updated_at?: string | null;
  updatedAt?: string | null;
  is_active: boolean;
  isActive?: boolean;
}

export interface UserSubscriptionStats {
  total: number;
  active: number;
  queued: number;
  expired: number;
  cancelled: number;
}


// Helper to get auth header
function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

// Generic fetch wrapper with error handling
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const json = await response.json();

    if (!response.ok || json.success === false) {
      let msg = json.error?.message || json.detail || "Terjadi kesalahan pada server.";
      if (json.error?.details && Array.isArray(json.error.details)) {
        const detailMsgs = json.error.details.map((d: any) => `${d.field}: ${d.message}`).join(", ");
        if (detailMsgs) {
          msg += ` (${detailMsgs})`;
        }
      }
      throw new Error(msg);
    }

    return json as T;
  } catch (err: any) {
    console.error(`API Fetch Error [${endpoint}]:`, err);
    throw err;
  }
}

// Specific API Services
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiFetch<ApiSuccessResponse<{ access_token: string; refresh_token: string }>>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    );
    if (res.data?.access_token) {
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("refreshToken", res.data.refresh_token);
      localStorage.setItem("isLoggedIn", "true");
    }
    return res;
  },

  loginGoogle: async (idToken?: string, email?: string, name?: string) => {
    const res = await apiFetch<ApiSuccessResponse<{ access_token: string; refresh_token: string }>>(
      "/auth/google",
      {
        method: "POST",
        body: JSON.stringify({ id_token: idToken, email, name }),
      }
    );
    if (res.data?.access_token) {
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("refreshToken", res.data.refresh_token);
      localStorage.setItem("isLoggedIn", "true");
    }
    return res;
  },

  getMe: async () => {
    return await apiFetch<ApiSuccessResponse<AdminUser>>(
      "/auth/me"
    );
  },

  logout: () => {
    try {
      apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    } catch {
      // ignore
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
  },
};

export const analyticsApi = {
  getOverview: async () => {
    return await apiFetch<ApiSuccessResponse<{
      totalSupport: number;
      totalCount: number;
      currentMonthSupport: number;
      averageSupport: number;
    }>>("/analytics/overview");
  },

  getMonthlyTrends: async () => {
    return await apiFetch<ApiSuccessResponse<Array<{
      month: string;
      year: number;
      totalSupport: number;
      totalCount: number;
    }>>>("/analytics/monthly");
  },

  getProductStats: async () => {
    return await apiFetch<ApiSuccessResponse<Array<{
      productId: string;
      label: string;
      count: number;
      sum: number;
    }>>>("/analytics/products");
  },

  getStatusDistribution: async () => {
    return await apiFetch<ApiSuccessResponse<Array<{
      status: string;
      count: number;
      percentage: number;
    }>>>("/analytics/status-distribution");
  },
};

export const transactionsApi = {
  list: async (params: {
    q?: string;
    status?: string;
    productId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    order?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.productId && params.productId !== "All") query.append("productId", params.productId);
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("pageSize", params.pageSize.toString());
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.order) query.append("order", params.order);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return await apiFetch<PaginatedApiSuccessResponse<{
      id: string;
      productId: string;
      name: string;
      amount: number;
      currency: string;
      status: "Success" | "Pending" | "Failed" | "Cancelled";
      userName: string;
      userEmail: string;
      createdAt: string;
    }>>(`/transactions${queryString}`);
  },

  getById: async (id: string) => {
    return await apiFetch<ApiSuccessResponse<{
      id: string;
      productId: string;
      name: string;
      amount: number;
      currency: string;
      status: string;
      userName: string;
      userEmail: string;
      createdAt: string;
    }>>(`/transactions/${id}`);
  },

  updateStatus: async (id: string, status: string) => {
    return await apiFetch<ApiSuccessResponse<any>>(`/transactions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  delete: async (id: string) => {
    return await apiFetch<ApiSuccessResponse<any>>(`/transactions/${id}`, {
      method: "DELETE",
    });
  },

  exportFile: async (format: "csv" | "json" = "csv", status?: string, productId?: string) => {
    const query = new URLSearchParams();
    query.append("format", format);
    if (status && status !== "All") query.append("status", status);
    if (productId && productId !== "All") query.append("productId", productId);

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/transactions/export?${query.toString()}`, { headers });
    if (!response.ok) {
      throw new Error(`Gagal mengunduh file ekspor ${format.toUpperCase()}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `transactions_export_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
};

export const adminsApi = {
  list: async () => {
    return await apiFetch<ApiSuccessResponse<AdminUser[]>>("/admins");
  },

  create: async (data: { email: string; name: string; password: string; role: string }) => {
    return await apiFetch<ApiSuccessResponse<AdminUser>>("/admins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  toggleActive: async (id: string, isActive: boolean) => {
    return await apiFetch<ApiSuccessResponse<AdminUser>>(`/admins/${id}/toggle-active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },
};

export const productsApi = {
  list: async (activeOnly: boolean = false) => {
    const res = await apiFetch<ApiSuccessResponse<any[]>>(`/products?active_only=${activeOnly}`);
    if (res.data && Array.isArray(res.data)) {
      res.data = res.data.map(p => ({
        ...p,
        isActive: p.is_active ?? p.isActive ?? true,
        is_active: p.is_active ?? p.isActive ?? true,
        billingPeriod: p.billing_period ?? p.billingPeriod ?? "monthly",
        billing_period: p.billing_period ?? p.billingPeriod ?? "monthly",
        trialDays: p.trial_days ?? p.trialDays ?? 7,
        trial_days: p.trial_days ?? p.trialDays ?? 7,
        originalAmount: p.original_amount ?? p.originalAmount ?? null,
        original_amount: p.original_amount ?? p.originalAmount ?? null,
        discountPercent: p.discount_percent ?? p.discountPercent ?? 0,
        discount_percent: p.discount_percent ?? p.discountPercent ?? 0,
        googlePlayProductId: p.google_play_product_id ?? p.googlePlayProductId ?? null,
        google_play_product_id: p.google_play_product_id ?? p.googlePlayProductId ?? null,
        createdAt: p.created_at ?? p.createdAt ?? "",
        created_at: p.created_at ?? p.createdAt ?? "",
      }));
    }
    return res as ApiSuccessResponse<ProductItem[]>;
  },

  create: async (data: {
    id: string;
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    billing_period?: string;
    billingPeriod?: string;
    trial_days?: number;
    trialDays?: number;
    original_amount?: number | null;
    originalAmount?: number | null;
    discount_percent?: number;
    discountPercent?: number;
    google_play_product_id?: string | null;
    googlePlayProductId?: string | null;
    is_active?: boolean;
    isActive?: boolean;
  }) => {
    const payload = {
      id: data.id,
      title: data.title,
      description: data.description || "",
      amount: Number(data.amount),
      currency: data.currency || "IDR",
      billing_period: data.billing_period || data.billingPeriod || "monthly",
      trial_days: data.trial_days ?? data.trialDays ?? 7,
      original_amount: data.original_amount ?? data.originalAmount ?? null,
      discount_percent: data.discount_percent ?? data.discountPercent ?? 0,
      google_play_product_id: data.google_play_product_id ?? data.googlePlayProductId ?? null,
      is_active: data.is_active ?? data.isActive ?? true,
    };
    return await apiFetch<ApiSuccessResponse<ProductItem>>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update: async (id: string, data: {
    title?: string;
    description?: string;
    amount?: number;
    currency?: string;
    billing_period?: string;
    billingPeriod?: string;
    trial_days?: number;
    trialDays?: number;
    original_amount?: number | null;
    originalAmount?: number | null;
    discount_percent?: number;
    discountPercent?: number;
    google_play_product_id?: string | null;
    googlePlayProductId?: string | null;
    is_active?: boolean;
    isActive?: boolean;
  }) => {
    const payload: Record<string, any> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description;
    if (data.amount !== undefined) payload.amount = Number(data.amount);
    if (data.currency !== undefined) payload.currency = data.currency;
    if (data.billing_period !== undefined || data.billingPeriod !== undefined) {
      payload.billing_period = data.billing_period ?? data.billingPeriod;
    }
    if (data.trial_days !== undefined || data.trialDays !== undefined) {
      payload.trial_days = data.trial_days ?? data.trialDays;
    }
    if (data.original_amount !== undefined || data.originalAmount !== undefined) {
      payload.original_amount = data.original_amount ?? data.originalAmount;
    }
    if (data.discount_percent !== undefined || data.discountPercent !== undefined) {
      payload.discount_percent = data.discount_percent ?? data.discountPercent;
    }
    if (data.google_play_product_id !== undefined || data.googlePlayProductId !== undefined) {
      payload.google_play_product_id = data.google_play_product_id ?? data.googlePlayProductId;
    }
    if (data.is_active !== undefined || data.isActive !== undefined) {
      payload.is_active = data.is_active ?? data.isActive;
    }

    return await apiFetch<ApiSuccessResponse<ProductItem>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string) => {
    return await apiFetch<ApiSuccessResponse<any>>(`/products/${id}`, {
      method: "DELETE",
    });
  },
};

export const subscriptionsApi = {
  list: async (params: {
    q?: string;
    status?: string;
    productId?: string;
    billingPeriod?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    order?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.append("q", params.q);
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.productId && params.productId !== "All") query.append("productId", params.productId);
    if (params.billingPeriod && params.billingPeriod !== "All") query.append("billingPeriod", params.billingPeriod);
    if (params.page) query.append("page", params.page.toString());
    if (params.pageSize) query.append("pageSize", params.pageSize.toString());
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.order) query.append("order", params.order);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    return await apiFetch<PaginatedApiSuccessResponse<UserSubscriptionItem>>(`/user-subscriptions${queryString}`);
  },

  getStats: async () => {
    return await apiFetch<ApiSuccessResponse<UserSubscriptionStats>>("/user-subscriptions/stats");
  },

  getById: async (id: string) => {
    return await apiFetch<ApiSuccessResponse<UserSubscriptionItem>>(`/user-subscriptions/${id}`);
  },

  updateStatus: async (id: string, status: string) => {
    return await apiFetch<ApiSuccessResponse<UserSubscriptionItem>>(`/user-subscriptions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  exportFile: async (format: "csv" | "json" = "csv", q?: string, status?: string, productId?: string) => {
    const query = new URLSearchParams();
    query.append("format", format);
    if (q) query.append("q", q);
    if (status && status !== "All") query.append("status", status);
    if (productId && productId !== "All") query.append("productId", productId);

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBaseUrl()}/user-subscriptions/export?${query.toString()}`, { headers });
    if (!response.ok) {
      throw new Error(`Gagal mengunduh file ekspor ${format.toUpperCase()}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `user_subscriptions_export_${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

