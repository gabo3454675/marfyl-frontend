import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/config/api-config';
import { clearSessionCookie } from '@/lib/auth-session-cookie';
import { FISCAL_PREVIEW_TOKEN, isFiscalPreviewMode, seedFiscalPreviewAuth } from '@/lib/fiscal-preview';
import { useAuthStore } from '@/store/useAuthStore';

function getApiUrl(): string {
  if (typeof window !== 'undefined' && (window as unknown as { __NEXT_PUBLIC_API_URL__?: string }).__NEXT_PUBLIC_API_URL__) {
    return (window as unknown as { __NEXT_PUBLIC_API_URL__: string }).__NEXT_PUBLIC_API_URL__;
  }
  return API_BASE_URL;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor: Usa la URL del API inyectada en runtime y añade token/tenant
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.baseURL = getApiUrl();
    // Solo en el cliente (browser)
    if (typeof window !== 'undefined') {
      if (isFiscalPreviewMode()) {
        seedFiscalPreviewAuth();
      }
      const token =
        localStorage.getItem('auth_token') ||
        (isFiscalPreviewMode() ? FISCAL_PREVIEW_TOKEN : null);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      try {
        const store = useAuthStore.getState();
        const selectedOrganizationId = store.selectedOrganizationId || store.selectedCompanyId;
        const isPublicRoute = config.url?.includes('/auth/');
        const isOrganizationsAll = config.url?.includes('/tenants/organizations-all');
        if (selectedOrganizationId && !isPublicRoute && !isOrganizationsAll) {
          config.headers['x-tenant-id'] = selectedOrganizationId.toString();
        }
      } catch (error) {
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const authData = JSON.parse(authStorage);
            const selectedCompanyId = authData?.state?.selectedCompanyId;
            if (selectedCompanyId) {
              const isPublicRoute = config.url?.includes('/auth/');
              if (!isPublicRoute) {
                config.headers['x-tenant-id'] = selectedCompanyId.toString();
              }
            }
          }
        } catch (fallbackError) {
          // no-op
        }
      }
    }
    // Remove Content-Type for FormData so Axios auto-sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token logic — evita refreshes concurrentes y loops infinitos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401 && !isFiscalPreviewMode()) {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // No intentar refresh si es un endpoint de auth (evita loop infinito)
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');
        if (isAuthEndpoint) {
          console.log('[apiClient] 401 on auth endpoint -> clearing session and redirecting to /login');
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // No intentar refresh si ya se está refrescando — encola el request
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        // Marcar como refrescando y obtener refresh token
        isRefreshing = true;
        originalRequest._retry = true;

        const refreshToken = localStorage.getItem('auth_refresh_token');
        if (!refreshToken) {
          isRefreshing = false;
          console.log('[apiClient] 401 with no refresh token -> clearing session and redirecting to /login');
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        try {
          console.log('[apiClient] 401 response -> attempting token refresh');
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const { access_token, refreshToken: newRefreshToken } = response.data;

          // Actualizar tokens en localStorage
          localStorage.setItem('auth_token', access_token);
          localStorage.setItem('auth_refresh_token', newRefreshToken);

          // Actualizar store
          const { setToken, setRefreshToken } = useAuthStore.getState();
          setToken(access_token);
          setRefreshToken(newRefreshToken);

          // Reintentar requests encolados con el nuevo token
          processQueue(null, access_token);

          // Reintentar request original
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          console.log('[apiClient] Token refresh successful -> retrying original request');
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh falló — rechazar requests encolados y limpiar sesión
          processQueue(refreshError, null);
          console.log('[apiClient] Token refresh failed -> clearing session and redirecting to /login');
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      if (
        error.response?.status === 400 &&
        (error.response?.data as any)?.message?.includes('x-tenant-id')
      ) {
        console.warn('No hay organización seleccionada');
      }
      if (error.response?.status === 403) {
        const data = error.response?.data as { message?: string; email?: string } | undefined;
        const message = typeof data?.message === 'string' ? data.message : '';
        if (message === 'RESET_REQUIRED') {
          let userEmail = '';
          try {
            if (data?.email) userEmail = data.email;
            if (!userEmail && typeof error.config?.data === 'string') {
              const parsed = JSON.parse(error.config.data) as { email?: string };
              if (parsed?.email) userEmail = parsed.email;
            }
          } catch {
            // ignored
          }
          const url = userEmail
            ? `/reset-password?email=${encodeURIComponent(userEmail)}`
            : '/reset-password';
          window.location.href = url;
          return Promise.reject(error);
        }
        if (typeof message === 'string' && (message.includes('organización') || message.includes('membresía'))) {
          console.error('Acceso denegado a la organización seleccionada');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
