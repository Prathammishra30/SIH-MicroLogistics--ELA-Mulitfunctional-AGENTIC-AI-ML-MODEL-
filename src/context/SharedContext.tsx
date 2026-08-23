import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { initialProducts, mockMarketOpportunities, mockLogisticsRequests, mockVehicles, initialProcurementRequests } from '../data/mockData';
import type { Product, MarketOpportunity, LogisticsRequest, TransporterVehicle, ProcurementRequest } from '../data/mockData';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
}

export interface SharedState {
  products: Product[];
  marketOpportunities: MarketOpportunity[];
  logisticsRequests: LogisticsRequest[]; // Acting as Deliveries / Shipments
  notifications: Notification[];
  vehicles: TransporterVehicle[];
  procurementRequests: ProcurementRequest[];
}

type SharedAction =
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'CREATE_DELIVERY'; payload: LogisticsRequest }
  | { type: 'UPDATE_DELIVERY_STATUS'; payload: { id: string; status: LogisticsRequest['status']; driver?: string; vehicle?: string; newTimelineEvent?: { status: string; time: string; completed: boolean } } }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'read'> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_VEHICLE'; payload: TransporterVehicle }
  | { type: 'UPDATE_VEHICLE_STATUS'; payload: { id: string; status: TransporterVehicle['status'] } }
  | { type: 'CREATE_PROCUREMENT'; payload: ProcurementRequest }
  | { type: 'UPDATE_PROCUREMENT'; payload: { id: string; status?: ProcurementRequest['status']; logisticsRequestId?: string; farmerName?: string } };

const generateId = () => Math.random().toString(36).substr(2, 9);

const STORAGE_KEY = 'ruralflow_shared_state';

const loadPersistedState = (): SharedState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<SharedState>;
      return {
        products: parsed.products ?? initialProducts,
        marketOpportunities: parsed.marketOpportunities ?? mockMarketOpportunities,
        logisticsRequests: parsed.logisticsRequests ?? mockLogisticsRequests,
        notifications: parsed.notifications ?? [],
        vehicles: parsed.vehicles ?? mockVehicles,
        procurementRequests: parsed.procurementRequests ?? initialProcurementRequests,
      };
    }
  } catch {
    // Corrupted localStorage — fall through to defaults
  }
  return {
    products: initialProducts,
    marketOpportunities: mockMarketOpportunities,
    logisticsRequests: mockLogisticsRequests,
    notifications: [],
    vehicles: mockVehicles,
    procurementRequests: initialProcurementRequests,
  };
};

const persistState = (state: SharedState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silently ignore
  }
};

const sharedReducer = (state: SharedState, action: SharedAction): SharedState => {
  switch (action.type) {
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };
    case 'CREATE_DELIVERY':
      return {
        ...state,
        logisticsRequests: [...state.logisticsRequests, action.payload],
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
      const targetDelivery = state.logisticsRequests.find(req => req.id === action.payload.id);
      const updatedLogistics = state.logisticsRequests.map((req) => {
        if (req.id === action.payload.id) {
          let updatedTimeline = req.timeline;
          if (action.payload.newTimelineEvent) {
            const eventIndex = req.timeline.findIndex(t => t.status === action.payload.newTimelineEvent?.status || t.status.includes(action.payload.status));
            if (eventIndex !== -1) {
              updatedTimeline = [...req.timeline];
              updatedTimeline[eventIndex] = { ...updatedTimeline[eventIndex], time: action.payload.newTimelineEvent.time, completed: true };
            } else {
              updatedTimeline = [...req.timeline, action.payload.newTimelineEvent];
            }
          }

          return {
            ...req,
            status: action.payload.status,
            driver: action.payload.driver !== undefined ? action.payload.driver : req.driver,
            vehicle: action.payload.vehicle !== undefined ? action.payload.vehicle : req.vehicle,
            timeline: updatedTimeline
          };
        }
        return req;
      });

      // Auto-sync status to linked procurement request
      let updatedProcurements = state.procurementRequests;
      if (action.payload.status === 'Delivered') {
        updatedProcurements = state.procurementRequests.map(pr =>
          pr.id === targetDelivery?.procurementRequestId || pr.logisticsRequestId === action.payload.id
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
        procurementRequests: [...state.procurementRequests, action.payload],
      };
    case 'UPDATE_PROCUREMENT':
      return {
        ...state,
        procurementRequests: state.procurementRequests.map((pr) =>
          pr.id === action.payload.id
            ? {
                ...pr,
                ...(action.payload.status !== undefined && { status: action.payload.status }),
                ...(action.payload.logisticsRequestId !== undefined && { logisticsRequestId: action.payload.logisticsRequestId }),
                ...(action.payload.farmerName !== undefined && { farmerName: action.payload.farmerName }),
              }
            : pr
        ),
      };
    default:
      return state;
  }
};

const SharedContext = createContext<{
  state: SharedState;
  dispatch: React.Dispatch<SharedAction>;
} | undefined>(undefined);

export const SharedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sharedReducer, undefined, loadPersistedState);

  // Persist state to localStorage on every change
  useEffect(() => {
    persistState(state);
  }, [state]);

  return (
    <SharedContext.Provider value={{ state, dispatch }}>
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
