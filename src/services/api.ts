// Centralized RuralFlow Frontend API Service
// Phase 4B/4C: Authentication & Data Ownership API Client

export type UserRole = 'FARMER' | 'BUYER' | 'TRANSPORTER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  createdAt?: string;
  profileId?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: string;
}

export interface AuthResponseData {
  user: AuthUser;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  // Farmer fields
  village?: string;
  district?: string;
  state?: string;
  producerType?: string;
  category?: string;
  farmName?: string;
  // Buyer fields
  businessName?: string;
  contactPerson?: string;
  businessType?: string;
  location?: string;
  gstin?: string;
  // Transporter fields
  fullName?: string;
  vehicleType?: string;
  vehicleRegNo?: string;
  capacity?: string;
  operatingRegion?: string;
  ownership?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ApiProduct {
  id: string;
  farmerId: string;
  name: string;
  category: string;
  quantity: string;
  grade: string;
  harvestDate: string;
  status: string;
  createdAt?: string;
}

export interface ApiLogisticsRequest {
  id: string;
  farmerId: string;
  productName: string;
  quantity?: string | null;
  pickupLocation?: string | null;
  estimatedEarnings?: string | null;
  status: string;
  driver?: string | null;
  vehicle?: string | null;
  destination: string;
  eta?: string | null;
  procurementRequestId?: string | null;
  createdAt?: string;
}

export interface ApiProcurementRequest {
  id: string;
  buyerId: string;
  product: string;
  quantity: string;
  targetPrice: string;
  destination: string;
  requiredBy: string;
  buyerName: string;
  farmerName?: string | null;
  status: string;
  logisticsRequestId?: string | null;
  createdAt?: string;
}

export interface ApiVehicle {
  id: string;
  transporterId: string;
  type: string;
  registration: string;
  capacity: string;
  capacityKg: number;
  status: string;
  utilization: number;
  createdAt?: string;
}

export interface ApiMarketOpportunity {
  id: string;
  demandItem: string;
  buyer: string;
  price: string;
  quantityRequired: string;
  distance: string;
  logisticsAvailable: boolean;
  matchScore: number;
  createdAt?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

const TOKEN_KEY = 'ruralflow_auth_token';
const USER_KEY = 'ruralflow_auth_user';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage unavailable
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage unavailable
    }
  },
};

export const userStorage = {
  get: (): AuthUser | null => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  set: (user: AuthUser): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // Storage unavailable
    }
  },
  remove: (): void => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch {
      // Storage unavailable
    }
  },
};

class ApiService {
  private baseUrl: string;
  private _onAuthExpired: (() => void) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Register a callback invoked when a 401 is received on an authenticated request.
   * Used by SharedContext to auto-logout without circular imports.
   */
  public onAuthExpired(callback: () => void): void {
    this._onAuthExpired = callback;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = tokenStorage.get();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json().catch(() => ({
        success: false,
        message: `HTTP error ${response.status}: ${response.statusText}`,
      }));

      if (!response.ok) {
        // 401 = authentication failure — clear stale auth and notify context
        if (response.status === 401 && token) {
          tokenStorage.remove();
          userStorage.remove();
          if (this._onAuthExpired) {
            this._onAuthExpired();
          }
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected network error occurred', { cause: error });
    }
  }

  // Authentication API endpoints
  public auth = {
    register: async (payload: RegisterPayload): Promise<AuthResponseData> => {
      const response = await this.request<AuthResponseData>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.data) {
        throw new Error(response.message || 'Registration failed');
      }

      tokenStorage.set(response.data.token);
      userStorage.set(response.data.user);

      return response.data;
    },

    login: async (payload: LoginPayload): Promise<AuthResponseData> => {
      const response = await this.request<AuthResponseData>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.data) {
        throw new Error(response.message || 'Login failed');
      }

      tokenStorage.set(response.data.token);
      userStorage.set(response.data.user);

      return response.data;
    },

    getMe: async (): Promise<AuthUser> => {
      const response = await this.request<{ user: AuthUser }>('/auth/me', {
        method: 'GET',
      });

      if (!response.data?.user) {
        throw new Error(response.message || 'Failed to fetch user session');
      }

      userStorage.set(response.data.user);
      return response.data.user;
    },

    logout: async (): Promise<void> => {
      try {
        const token = tokenStorage.get();
        if (token) {
          await this.request('/auth/logout', { method: 'POST' });
        }
      } catch {
        // Fallback: Proceed to remove local credentials even if server unreachable
      } finally {
        tokenStorage.remove();
        userStorage.remove();
      }
    },
  };

  // Farmer endpoints (User-Owned Data)
  public farmer = {
    getProducts: async (): Promise<ApiProduct[]> => {
      const res = await this.request<{ products: ApiProduct[] }>('/farmer/products');
      return res.data?.products || [];
    },

    addProduct: async (payload: {
      name: string;
      category: string;
      quantity: string;
      grade?: string;
      harvestDate?: string;
    }): Promise<ApiProduct> => {
      const res = await this.request<{ product: ApiProduct }>('/farmer/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.data?.product) throw new Error(res.message || 'Failed to add product');
      return res.data.product;
    },

    getLogistics: async (): Promise<ApiLogisticsRequest[]> => {
      const res = await this.request<{ logisticsRequests: ApiLogisticsRequest[] }>('/farmer/logistics');
      return res.data?.logisticsRequests || [];
    },

    createLogistics: async (payload: {
      productName: string;
      productId?: string;
      quantity?: string;
      pickupLocation?: string;
      destination: string;
      estimatedEarnings?: string;
      procurementRequestId?: string;
    }): Promise<ApiLogisticsRequest> => {
      const res = await this.request<{ logisticsRequest: ApiLogisticsRequest }>('/farmer/logistics', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.data?.logisticsRequest) throw new Error(res.message || 'Failed to create logistics request');
      return res.data.logisticsRequest;
    },
  };

  // Market Opportunities (Global Platform-Wide Data)
  public market = {
    getOpportunities: async (): Promise<ApiMarketOpportunity[]> => {
      const res = await this.request<{ opportunities: ApiMarketOpportunity[] }>('/market/opportunities');
      return res.data?.opportunities || [];
    },

    getDemands: async (): Promise<ApiProcurementRequest[]> => {
      const res = await this.request<{ procurements: ApiProcurementRequest[] }>('/market/demands');
      return res.data?.procurements || [];
    },
  };

  // Buyer endpoints (User-Owned Data + Market Produce)
  public buyer = {
    getProcurements: async (): Promise<ApiProcurementRequest[]> => {
      const res = await this.request<{ procurements: ApiProcurementRequest[] }>('/buyer/procurements');
      return res.data?.procurements || [];
    },

    createProcurement: async (payload: {
      product: string;
      quantity: string;
      targetPrice: string;
      destination: string;
      requiredBy?: string;
    }): Promise<ApiProcurementRequest> => {
      const res = await this.request<{ procurement: ApiProcurementRequest }>('/buyer/procurements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.data?.procurement) throw new Error(res.message || 'Failed to create procurement');
      return res.data.procurement;
    },

    getAvailableProduce: async (): Promise<ApiProduct[]> => {
      const res = await this.request<{ products: ApiProduct[] }>('/buyer/produce');
      return res.data?.products || [];
    },
  };

  // Transporter endpoints (User-Owned Data + Live Trip Matching)
  public transporter = {
    getVehicles: async (): Promise<ApiVehicle[]> => {
      const res = await this.request<{ vehicles: ApiVehicle[] }>('/transporter/vehicles');
      return res.data?.vehicles || [];
    },

    createVehicle: async (payload: {
      type: string;
      registration: string;
      capacity: string;
    }): Promise<ApiVehicle> => {
      const res = await this.request<{ vehicle: ApiVehicle }>('/transporter/vehicles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.data?.vehicle) throw new Error(res.message || 'Failed to add vehicle');
      return res.data.vehicle;
    },

    updateVehicle: async (id: string, payload: {
      type?: string;
      registration?: string;
      capacity?: string;
      status?: string;
    }): Promise<ApiVehicle> => {
      const res = await this.request<{ vehicle: ApiVehicle }>(`/transporter/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (!res.data?.vehicle) throw new Error(res.message || 'Failed to update vehicle');
      return res.data.vehicle;
    },

    deactivateVehicle: async (id: string): Promise<ApiVehicle> => {
      const res = await this.request<{ vehicle: ApiVehicle }>(`/transporter/vehicles/${id}`, {
        method: 'DELETE',
      });
      if (!res.data?.vehicle) throw new Error(res.message || 'Failed to deactivate vehicle');
      return res.data.vehicle;
    },

    getAvailableTrips: async (): Promise<ApiLogisticsRequest[]> => {
      const res = await this.request<{ trips: ApiLogisticsRequest[] }>('/transporter/logistics/available');
      return res.data?.trips || [];
    },

    getActiveTrips: async (): Promise<ApiLogisticsRequest[]> => {
      const res = await this.request<{ trips: ApiLogisticsRequest[] }>('/transporter/trips/active');
      return res.data?.trips || [];
    },

    acceptTrip: async (id: string, payload: { driver?: string; vehicle?: string; vehicleId?: string }): Promise<ApiLogisticsRequest> => {
      const res = await this.request<{ trip: ApiLogisticsRequest }>(`/transporter/trips/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (!res.data?.trip) throw new Error(res.message || 'Failed to accept trip');
      return res.data.trip;
    },

    updateTripStatus: async (id: string, status: string, eta?: string): Promise<ApiLogisticsRequest> => {
      const res = await this.request<{ trip: ApiLogisticsRequest }>(`/transporter/trips/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, eta }),
      });
      if (!res.data?.trip) throw new Error(res.message || 'Failed to update trip status');
      return res.data.trip;
    },
  };

  // Health check
  public async getHealth(): Promise<ApiResponse> {
    return this.request('/health', { method: 'GET' });
  }
}

export const api = new ApiService(API_BASE_URL);
export const authApi = api.auth;
export const farmerApi = api.farmer;
export const marketApi = api.market;
export const buyerApi = api.buyer;
export const transporterApi = api.transporter;
