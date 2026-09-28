const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
  const url = `${API_BASE_URL}${endpoint}`;
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

  getMe: async () => {
    return await apiFetch<ApiSuccessResponse<{ id: string; email: string; name: string; role: string }>>(
      "/auth/me"
    );
  },

  logout: () => {
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

    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/transactions/export?${query.toString()}`, { headers });
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
    return await apiFetch<ApiSuccessResponse<Array<{
      id: string;
      email: string;
      name: string;
      role: string;
      is_active: boolean;
      created_at: string;
      last_login_at?: string;
    }>>>("/admins");
  },

  create: async (data: { email: string; name: string; password: string; role: string }) => {
    return await apiFetch<ApiSuccessResponse<any>>("/admins", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  toggleActive: async (id: string, isActive: boolean) => {
    return await apiFetch<ApiSuccessResponse<any>>(`/admins/${id}/toggle-active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
  },
};

export const productsApi = {
  list: async (activeOnly: boolean = false) => {
    const qStr = activeOnly ? "?active_only=true" : "";
    return await apiFetch<ApiSuccessResponse<Array<{
      id: string;
      title: string;
      description?: string;
      amount: number;
      currency: string;
      isActive: boolean;
      createdAt: string;
    }>>>(`/products${qStr}`);
  },

  create: async (data: { id: string; title: string; description?: string; amount: number; currency?: string; isActive?: boolean }) => {
    return await apiFetch<ApiSuccessResponse<any>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { title?: string; description?: string; amount?: number; isActive?: boolean }) => {
    return await apiFetch<ApiSuccessResponse<any>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return await apiFetch<ApiSuccessResponse<any>>(`/products/${id}`, {
      method: "DELETE",
    });
  },
};
