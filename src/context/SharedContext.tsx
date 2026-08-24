import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  mockMarketOpportunities,
} from '../data/mockData';
import type {
  Product,
  MarketOpportunity,
  LogisticsRequest,
  TransporterVehicle,
  ProcurementRequest,
} from '../data/mockData';
import {
  api,
  authApi,
  farmerApi,
  marketApi,
  buyerApi,
  transporterApi,
  tokenStorage,
  userStorage,
} from '../services/api';
import type {
  AuthUser,
  UserRole,
  RegisterPayload,
} from '../services/api';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
}

export interface SharedState {
  products: Product[];
  marketOpportunities: MarketOpportunity[];
  logisticsRequests: LogisticsRequest[]; // Deliveries / Shipments
  notifications: Notification[];
  vehicles: TransporterVehicle[];
  procurementRequests: ProcurementRequest[];
  auth: AuthState;
}

type SharedAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'CREATE_DELIVERY'; payload: LogisticsRequest }
  | {
      type: 'UPDATE_DELIVERY_STATUS';
      payload: {
        id: string;
        status: LogisticsRequest['status'];
        driver?: string;
        vehicle?: string;
        newTimelineEvent?: { status: string; time: string; completed: boolean };
      };
    }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_VEHICLE'; payload: TransporterVehicle }
  | { type: 'UPDATE_VEHICLE_STATUS'; payload: { id: string; status: TransporterVehicle['status'] } }
  | { type: 'CREATE_PROCUREMENT'; payload: ProcurementRequest }
  | {
      type: 'UPDATE_PROCUREMENT';
      payload: {
        id: string;
        status?: ProcurementRequest['status'];
        logisticsRequestId?: string;
        farmerName?: string;
      };
    }
  | { type: 'SET_AUTH'; payload: { user: AuthUser; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_AUTH_LOADING'; payload: boolean }
  | {
      type: 'SET_USER_DATA';
      payload: {
        products?: Product[];
        logisticsRequests?: LogisticsRequest[];
        procurementRequests?: ProcurementRequest[];
        vehicles?: TransporterVehicle[];
        marketOpportunities?: MarketOpportunity[];
      };
    };

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Loads initial state.
 * User-owned business data starts EMPTY — it will be populated from PostgreSQL APIs.
 * Only platform-wide market opportunities use mock data as a fallback for unauthenticated state.
 */
const loadPersistedState = (): SharedState => {
  const token = tokenStorage.get();
  const user = userStorage.get();

  const initialAuth: AuthState = {
    user: user || null,
    token: token || null,
    isAuthenticated: Boolean(token && user),
    isLoading: false,
    role: user?.role || null,
  };

  return {
    products: [],
    marketOpportunities: mockMarketOpportunities,
    logisticsRequests: [],
    notifications: [],
    vehicles: [],
    procurementRequests: [],
    auth: initialAuth,
  };
};

const sharedReducer = (state: SharedState, action: SharedAction): SharedState => {
  switch (action.type) {
    case 'SET_USER_DATA':
      return {
        ...state,
        ...(action.payload.products !== undefined && { products: action.payload.products }),
        ...(action.payload.logisticsRequests !== undefined && {
          logisticsRequests: action.payload.logisticsRequests,
        }),
        ...(action.payload.procurementRequests !== undefined && {
          procurementRequests: action.payload.procurementRequests,
        }),
        ...(action.payload.vehicles !== undefined && { vehicles: action.payload.vehicles }),
        ...(action.payload.marketOpportunities !== undefined && {
          marketOpportunities: action.payload.marketOpportunities,
        }),
      };
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [action.payload, ...state.products.filter((p) => p.id !== action.payload.id)],
      };
    case 'CREATE_DELIVERY':
      return {
        ...state,
        logisticsRequests: [action.payload, ...state.logisticsRequests.filter((r) => r.id !== action.payload.id)],
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          { ...action.payload, id: generateId(), read: false },
        ],
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case 'UPDATE_DELIVERY_STATUS': {
      const targetDelivery = state.logisticsRequests.find((req) => req.id === action.payload.id);
      const updatedLogistics = state.logisticsRequests.map((req) => {
        if (req.id === action.payload.id) {
          let updatedTimeline = req.timeline;
          if (action.payload.newTimelineEvent) {
            const eventIndex = req.timeline.findIndex(
              (t) =>
                t.status === action.payload.newTimelineEvent?.status ||
                t.status.includes(action.payload.status)
            );
            if (eventIndex !== -1) {
              updatedTimeline = [...req.timeline];
              updatedTimeline[eventIndex] = {
                ...updatedTimeline[eventIndex],
                time: action.payload.newTimelineEvent.time,
                completed: true,
              };
            } else {
              updatedTimeline = [...req.timeline, action.payload.newTimelineEvent];
            }
          }

          return {
            ...req,
            status: action.payload.status,
            driver: action.payload.driver !== undefined ? action.payload.driver : req.driver,
            vehicle: action.payload.vehicle !== undefined ? action.payload.vehicle : req.vehicle,
            timeline: updatedTimeline,
          };
        }
        return req;
      });

      // Auto-sync status to linked procurement request
      let updatedProcurements = state.procurementRequests;
      if (action.payload.status === 'Delivered') {
        updatedProcurements = state.procurementRequests.map((pr) =>
          pr.id === targetDelivery?.procurementRequestId ||
          pr.logisticsRequestId === action.payload.id
            ? { ...pr, status: 'Completed' }
            : pr
        );
      }

      return {
        ...state,
        logisticsRequests: updatedLogistics,
        procurementRequests: updatedProcurements,
      };
    }
    case 'ADD_VEHICLE':
      return {
        ...state,
        vehicles: [...state.vehicles, action.payload],
      };
    case 'UPDATE_VEHICLE_STATUS':
      return {
        ...state,
        vehicles: state.vehicles.map((v) =>
          v.id === action.payload.id ? { ...v, status: action.payload.status } : v
        ),
      };
    case 'CREATE_PROCUREMENT':
      return {
        ...state,
        procurementRequests: [action.payload, ...state.procurementRequests],
      };
    case 'UPDATE_PROCUREMENT':
      return {
        ...state,
        procurementRequests: state.procurementRequests.map((pr) =>
          pr.id === action.payload.id
            ? {
                ...pr,
                ...(action.payload.status !== undefined && { status: action.payload.status }),
                ...(action.payload.logisticsRequestId !== undefined && {
                  logisticsRequestId: action.payload.logisticsRequestId,
                }),
                ...(action.payload.farmerName !== undefined && {
                  farmerName: action.payload.farmerName,
                }),
              }
            : pr
        ),
      };
    case 'SET_AUTH':
      return {
        ...state,
        auth: {
          user: action.payload.user,
          token: action.payload.token,
          isAuthenticated: true,
          isLoading: false,
          role: action.payload.user.role,
        },
      };
    case 'LOGOUT':
      return {
        ...state,
        products: [],
        logisticsRequests: [],
        procurementRequests: [],
        vehicles: [],
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          role: null,
        },
      };
    case 'SET_AUTH_LOADING':
      return {
        ...state,
        auth: {
          ...state.auth,
          isLoading: action.payload,
        },
      };
    default:
      return state;
  }
};

export interface SharedContextValue {
  state: SharedState;
  dispatch: React.Dispatch<SharedAction>;
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<AuthUser>;
  register: (payload: RegisterPayload, expectedRole?: UserRole) => Promise<AuthUser>;
  logout: () => void;
  refreshSession: () => Promise<AuthUser | null>;
  loadUserBusinessData: (user: AuthUser) => Promise<void>;
}

const SharedContext = createContext<SharedContextValue | undefined>(undefined);

export const SharedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sharedReducer, undefined, loadPersistedState);

  // Load user business data from backend APIs
  const loadUserBusinessData = useCallback(async (user: AuthUser) => {
    try {
      // 1. Always load platform-wide market opportunities (shared intelligence)
      let marketOps: MarketOpportunity[] = [];
      try {
        const remoteOps = await marketApi.getOpportunities();
        if (remoteOps && remoteOps.length > 0) {
          marketOps = remoteOps.map((m) => ({
            id: m.id,
            demandItem: m.demandItem,
            buyer: m.buyer,
            price: m.price,
            quantityRequired: m.quantityRequired,
            distance: m.distance,
            logisticsAvailable: m.logisticsAvailable,
            matchScore: m.matchScore,
          }));
        }
      } catch (err) {
        console.warn('Could not fetch market opportunities, keeping fallback:', err);
      }

      if (user.role === 'FARMER') {
        const [remoteProducts, remoteLogistics, openDemands] = await Promise.all([
          farmerApi.getProducts(),
          farmerApi.getLogistics(),
          marketApi.getDemands(),
        ]);

        const mappedProducts: Product[] = remoteProducts.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          grade: p.grade,
          harvestDate: p.harvestDate,
          status: (p.status as Product['status']) || 'Available',
        }));

        const mappedLogistics: LogisticsRequest[] = remoteLogistics.map((r) => ({
          id: r.id,
          productName: r.productName,
          quantity: r.quantity || undefined,
          pickupLocation: r.pickupLocation || undefined,
          estimatedEarnings: r.estimatedEarnings || undefined,
          status: (r.status as LogisticsRequest['status']) || 'Searching',
          driver: r.driver || null,
          vehicle: r.vehicle || null,
          destination: r.destination,
          eta: r.eta || null,
          timeline: [
            { status: 'Request Created', time: 'Just now', completed: true },
            { status: 'Transport Match', time: r.driver ? 'Assigned' : 'In progress', completed: !!r.driver },
            { status: 'Pickup Scheduled', time: r.status === 'At Pickup' || r.status === 'Picked Up' || r.status === 'In Transit' || r.status === 'Delivered' ? 'Completed' : 'Pending', completed: r.status !== 'Searching' && r.status !== 'Assigned' },
            { status: 'In Transit', time: r.status === 'In Transit' || r.status === 'Delivered' ? 'En Route' : 'Pending', completed: r.status === 'In Transit' || r.status === 'Delivered' },
            { status: 'Delivered', time: r.status === 'Delivered' ? 'Completed' : 'Pending', completed: r.status === 'Delivered' },
          ],
          procurementRequestId: r.procurementRequestId || undefined,
        }));

        const mappedDemands: ProcurementRequest[] = openDemands.map((pr) => ({
          id: pr.id,
          product: pr.product,
          quantity: pr.quantity,
          targetPrice: pr.targetPrice,
          destination: pr.destination,
          requiredBy: pr.requiredBy,
          buyerName: pr.buyerName,
          farmerName: pr.farmerName || undefined,
          status: (pr.status as ProcurementRequest['status']) || 'Open',
          logisticsRequestId: pr.logisticsRequestId || null,
          createdAt: pr.createdAt || new Date().toISOString(),
        }));

        dispatch({
          type: 'SET_USER_DATA',
          payload: {
            products: mappedProducts,
            logisticsRequests: mappedLogistics,
            procurementRequests: mappedDemands,
            ...(marketOps.length > 0 ? { marketOpportunities: marketOps } : {}),
          },
        });
      } else if (user.role === 'BUYER') {
        const [remoteProcurements, availableProduce] = await Promise.all([
          buyerApi.getProcurements(),
          buyerApi.getAvailableProduce(),
        ]);

        const mappedProcurements: ProcurementRequest[] = remoteProcurements.map((pr) => ({
          id: pr.id,
          product: pr.product,
          quantity: pr.quantity,
          targetPrice: pr.targetPrice,
          destination: pr.destination,
          requiredBy: pr.requiredBy,
          buyerName: pr.buyerName,
          farmerName: pr.farmerName || undefined,
          status: (pr.status as ProcurementRequest['status']) || 'Open',
          logisticsRequestId: pr.logisticsRequestId || null,
          createdAt: pr.createdAt || new Date().toISOString(),
        }));

        const mappedProducts: Product[] = availableProduce.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          quantity: p.quantity,
          grade: p.grade,
          harvestDate: p.harvestDate,
          status: (p.status as Product['status']) || 'Available',
        }));

        dispatch({
          type: 'SET_USER_DATA',
          payload: {
            procurementRequests: mappedProcurements,
            products: mappedProducts,
            ...(marketOps.length > 0 ? { marketOpportunities: marketOps } : {}),
          },
        });
      } else if (user.role === 'TRANSPORTER') {
        const [remoteVehicles, availableTrips, activeTrips] = await Promise.all([
          transporterApi.getVehicles(),
          transporterApi.getAvailableTrips(),
          transporterApi.getActiveTrips(),
        ]);

        const mappedVehicles: TransporterVehicle[] = remoteVehicles.map((v) => ({
          id: v.id,
          type: v.type,
          registration: v.registration,
          capacity: v.capacity,
          status: (v.status as TransporterVehicle['status']) || 'Available',
          utilization: v.utilization,
        }));

        // Deduplicate and combine available trips (Searching) and assigned active trips
        const tripMap = new Map<string, LogisticsRequest>();
        [...availableTrips, ...activeTrips].forEach((r) => {
          tripMap.set(r.id, {
            id: r.id,
            productName: r.productName,
            quantity: r.quantity || undefined,
            pickupLocation: r.pickupLocation || undefined,
            estimatedEarnings: r.estimatedEarnings || undefined,
            status: (r.status as LogisticsRequest['status']) || 'Searching',
            driver: r.driver || null,
            vehicle: r.vehicle || null,
            destination: r.destination,
            eta: r.eta || null,
            timeline: [
              { status: 'Request Created', time: 'Just now', completed: true },
              { status: 'Transport Match', time: r.driver ? 'Assigned' : 'In progress', completed: !!r.driver },
              { status: 'Pickup Scheduled', time: r.status === 'At Pickup' || r.status === 'Picked Up' || r.status === 'In Transit' || r.status === 'Delivered' ? 'Completed' : 'Pending', completed: r.status !== 'Searching' && r.status !== 'Assigned' },
              { status: 'In Transit', time: r.status === 'In Transit' || r.status === 'Delivered' ? 'En Route' : 'Pending', completed: r.status === 'In Transit' || r.status === 'Delivered' },
              { status: 'Delivered', time: r.status === 'Delivered' ? 'Completed' : 'Pending', completed: r.status === 'Delivered' },
            ],
            procurementRequestId: r.procurementRequestId || undefined,
          });
        });

        dispatch({
          type: 'SET_USER_DATA',
          payload: {
            vehicles: mappedVehicles,
            logisticsRequests: Array.from(tripMap.values()),
            ...(marketOps.length > 0 ? { marketOpportunities: marketOps } : {}),
          },
        });
      }
    } catch (err) {
      console.error('Error loading user-owned data from backend:', err);
      throw err; // Re-throw to ensure login/register reveals the actual problem instead of showing an empty dashboard
    }
  }, []);

  // Session verification and initial data load on app load
  useEffect(() => {
    const verifyExistingSession = async () => {
      const token = tokenStorage.get();
      if (!token) {
        // Load public market opportunities even for unauthenticated state
        try {
          const ops = await marketApi.getOpportunities();
          if (ops && ops.length > 0) {
            dispatch({
              type: 'SET_USER_DATA',
              payload: {
                marketOpportunities: ops.map((m) => ({
                  id: m.id,
                  demandItem: m.demandItem,
                  buyer: m.buyer,
                  price: m.price,
                  quantityRequired: m.quantityRequired,
                  distance: m.distance,
                  logisticsAvailable: m.logisticsAvailable,
                  matchScore: m.matchScore,
                })),
              },
            });
          }
        } catch {
          // Keep default mock data
        }
        return;
      }

      try {
        const user = await authApi.getMe();
        dispatch({
          type: 'SET_AUTH',
          payload: { user, token },
        });
        await loadUserBusinessData(user);
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        authApi.logout();
        dispatch({ type: 'LOGOUT' });
      }
    };

    verifyExistingSession();
  }, [loadUserBusinessData]);

  // Register 401 interceptor for automatic auth expiry handling
  useEffect(() => {
    api.onAuthExpired(() => {
      dispatch({ type: 'LOGOUT' });
    });
  }, []);

  // Centralized Auth Actions
  const login = useCallback(
    async (email: string, password: string, expectedRole?: UserRole): Promise<AuthUser> => {
      dispatch({ type: 'SET_AUTH_LOADING', payload: true });
      try {
        const authData = await authApi.login({ email, password });

        // Role mismatch protection
        if (expectedRole && authData.user.role !== expectedRole && authData.user.role !== 'ADMIN') {
          authApi.logout();
          dispatch({ type: 'LOGOUT' });
          throw new Error(
            `Account role mismatch: Your account is registered as ${authData.user.role}, but you are signing in via the ${expectedRole} portal. Please use the correct role portal.`
          );
        }

        dispatch({
          type: 'SET_AUTH',
          payload: { user: authData.user, token: authData.token },
        });

        // Load private business data owned by this user
        await loadUserBusinessData(authData.user);

        return authData.user;
      } catch (error) {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        throw error;
      }
    },
    [loadUserBusinessData]
  );

  const register = useCallback(
    async (payload: RegisterPayload, expectedRole?: UserRole): Promise<AuthUser> => {
      dispatch({ type: 'SET_AUTH_LOADING', payload: true });
      try {
        const authData = await authApi.register(payload);

        // Role mismatch protection
        if (expectedRole && authData.user.role !== expectedRole) {
          authApi.logout();
          dispatch({ type: 'LOGOUT' });
          throw new Error(
            `Account role mismatch: Registered role ${authData.user.role} does not match portal role ${expectedRole}.`
          );
        }

        dispatch({
          type: 'SET_AUTH',
          payload: { user: authData.user, token: authData.token },
        });

        // New user starts clean (0 products, 0 deliveries, 0 requests)
        await loadUserBusinessData(authData.user);

        return authData.user;
      } catch (error) {
        dispatch({ type: 'SET_AUTH_LOADING', payload: false });
        throw error;
      }
    },
    [loadUserBusinessData]
  );

  const logout = useCallback(() => {
    authApi.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    const token = tokenStorage.get();
    if (!token) {
      logout();
      return null;
    }

    try {
      const user = await authApi.getMe();
      dispatch({
        type: 'SET_AUTH',
        payload: { user, token },
      });
      await loadUserBusinessData(user);
      return user;
    } catch {
      logout();
      return null;
    }
  }, [loadUserBusinessData, logout]);

  return (
    <SharedContext.Provider
      value={{
        state,
        dispatch,
        login,
        register,
        logout,
        refreshSession,
        loadUserBusinessData,
      }}
    >
      {children}
    </SharedContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSharedContext = () => {
  const context = useContext(SharedContext);
  if (context === undefined) {
    throw new Error('useSharedContext must be used within a SharedProvider');
  }
  return context;
};
