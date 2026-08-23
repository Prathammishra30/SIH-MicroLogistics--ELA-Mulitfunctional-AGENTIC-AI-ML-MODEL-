// Mock Data for RuralFlow Phase 3A - Farmer Dashboard

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: string;
  grade: string;
  harvestDate: string;
  status: 'Available' | 'In Transit' | 'Sold';
}

export interface MarketOpportunity {
  id: string;
  demandItem: string;
  buyer: string;
  price: string;
  quantityRequired: string;
  distance: string;
  logisticsAvailable: boolean;
  matchScore: number;
  isLiveBuyer?: boolean;
  procurementId?: string;
}

export interface LogisticsRequest {
  id: string;
  productName: string;
  quantity?: string;
  pickupLocation?: string;
  estimatedEarnings?: string;
  status: 'Searching' | 'Assigned' | 'At Pickup' | 'Picked Up' | 'In Transit' | 'Delivered';
  driver: string | null;
  vehicle: string | null;
  destination: string;
  eta: string | null;
  timeline: { status: string; time: string; completed: boolean }[];
  procurementRequestId?: string;
}

export interface TransporterVehicle {
  id: string;
  type: string;
  registration: string;
  capacity: string;
  status: 'Available' | 'Busy' | 'Maintenance' | 'Offline';
  utilization: number;
}

export interface ProcurementRequest {
  id: string;
  product: string;
  quantity: string;
  targetPrice: string;
  destination: string;
  requiredBy: string;
  buyerName: string;
  farmerName?: string;
  status: 'Open' | 'Fulfilling' | 'Logistics Requested' | 'Completed';
  logisticsRequestId: string | null;
  createdAt: string;
}

export const initialProducts: Product[] = [
  {
    id: 'PRD-101',
    name: 'Organic Tomatoes',
    category: 'Vegetables',
    quantity: '1.2 MT',
    grade: 'Grade A',
    harvestDate: '2023-10-14',
    status: 'Available',
  },
  {
    id: 'PRD-102',
    name: 'Red Onions',
    category: 'Vegetables',
    quantity: '3.5 MT',
    grade: 'Standard',
    harvestDate: '2023-10-12',
    status: 'Available',
  },
  {
    id: 'PRD-103',
    name: 'Cauliflower',
    category: 'Vegetables',
    quantity: '450 Kg',
    grade: 'Premium',
    harvestDate: '2023-10-10',
    status: 'Sold',
  },
  {
    id: 'PRD-104',
    name: 'Sharbati Wheat',
    category: 'Grains',
    quantity: '2.5 MT',
    grade: 'Grade A',
    harvestDate: '2023-10-18',
    status: 'Available',
  }
];

export const mockMarketOpportunities: MarketOpportunity[] = [
  {
    id: 'MKT-201',
    demandItem: 'Organic Tomatoes (Grade A)',
    buyer: 'Pune Vashi Demand',
    price: '₹38/kg',
    quantityRequired: '1,200 kg',
    distance: '45 km',
    logisticsAvailable: true,
    matchScore: 98,
  },
  {
    id: 'MKT-202',
    demandItem: 'Fresh Red Onions',
    buyer: 'Navi Mumbai APMC',
    price: '₹29/kg',
    quantityRequired: '3.5 MT',
    distance: '110 km',
    logisticsAvailable: true,
    matchScore: 85,
  }
];

export const mockLogisticsRequests: LogisticsRequest[] = [
  {
    id: 'RF-1029',
    productName: 'Organic Tomatoes (Grade A)',
    quantity: '500 kg',
    pickupLocation: 'Village A',
    estimatedEarnings: '₹1,850',
    status: 'In Transit',
    driver: 'Sunil Deshmukh',
    vehicle: 'Medium Goods Carrier (MH 14 CD 5678)',
    destination: 'Pune Vashi Market',
    eta: 'Today, 2:30 PM',
    timeline: [
      { status: 'Request Created', time: 'Oct 24, 08:00 AM', completed: true },
      { status: 'Transport Match', time: 'Oct 24, 08:15 AM', completed: true },
      { status: 'Pickup Scheduled', time: 'Oct 24, 09:00 AM', completed: true },
      { status: 'In Transit', time: 'Oct 24, 10:30 AM', completed: true },
      { status: 'Delivered', time: 'Pending', completed: false }
    ],
    procurementRequestId: 'PR-1001'
  }
];

export const mockVehicles: TransporterVehicle[] = [
  {
    id: 'VEH-001',
    type: 'Medium Goods Carrier',
    registration: 'UP 70 AB 1234',
    capacity: '700 kg',
    status: 'Available',
    utilization: 71,
  },
  {
    id: 'VEH-002',
    type: 'Large Goods Carrier',
    registration: 'MH 12 CD 5678',
    capacity: '2.5 MT',
    status: 'Busy',
    utilization: 100,
  }
];

export const initialProcurementRequests: ProcurementRequest[] = [
  {
    id: 'PR-1001',
    product: 'Organic Tomatoes (Grade A)',
    quantity: '500 kg',
    targetPrice: '₹38/kg',
    destination: 'Pune Vashi Market',
    requiredBy: '2026-08-24',
    buyerName: 'Rajesh Singhania',
    status: 'Logistics Requested',
    logisticsRequestId: 'RF-1029',
    createdAt: '2026-08-23T08:00:00'
  }
];
